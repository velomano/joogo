import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'nodejs';

// OpenAI 클라이언트 초기화
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 타임아웃 설정 (5초로 단축 - 대용량 데이터 고려)
const QUERY_TIMEOUT = 5000;

// 대용량 데이터 처리를 위한 페이지네이션
const BATCH_SIZE = 1000;

// 대용량 데이터 최적화를 위한 집계 쿼리
async function getAggregatedStats(supabase: any, tenantId: string) {
  try {
    console.log('=== 집계 통계 조회 시작 ===');
    console.log('테넌트 ID:', tenantId);
    
              // 1. 기본 통계 (빠른 집계) - RPC 함수 사용
     console.log('RPC 함수로 items 조회 시도...');
     
     const { data: basicStats, error: basicErr } = await supabase
       .rpc('list_items', { _tenant_id: tenantId });
    
    console.log('쿼리 결과:', { data: basicStats, error: basicErr });
    
    if (basicErr) {
      console.error('집계 통계 조회 에러:', basicErr);
      throw basicErr;
    }

    const items = basicStats || [];
    console.log('조회된 아이템 수:', items.length);
    console.log('조회된 데이터 샘플:', items.slice(0, 3));
    
    const totalProducts = items.length;
    const totalQuantity = items.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0);
    const averageQuantity = totalProducts > 0 ? totalQuantity / totalProducts : 0;

    console.log('계산된 통계:', {
      totalProducts,
      totalQuantity,
      averageQuantity
    });

    // 2. 수량별 분포 (메모리 효율적)
    const quantityDistribution = {
      high: items.filter((item: any) => Number(item.qty || 0) >= 50).length,
      medium: items.filter((item: any) => Number(item.qty || 0) >= 10 && Number(item.qty || 0) < 50).length,
      low: items.filter((item: any) => Number(item.qty || 0) < 10).length,
      zero: items.filter((item: any) => Number(item.qty || 0) === 0).length
    };

    // 3. 부족 재고 및 품절 (필터링)
    const lowStockItems = items.filter((item: any) => Number(item.qty || 0) < 10).length;
    const outOfStockItems = items.filter((item: any) => Number(item.qty || 0) === 0).length;

    const result = {
      totalProducts,
      totalQuantity,
      averageQuantity,
      quantityDistribution,
      lowStockItems,
      outOfStockItems
    };

    console.log('최종 결과:', result);
    console.log('=== 집계 통계 조회 완료 ===');
    
    return result;
  } catch (error) {
    console.error('집계 통계 조회 실패:', error);
    return {
      totalProducts: 0,
      totalQuantity: 0,
      averageQuantity: 0,
      quantityDistribution: { high: 0, medium: 0, low: 0, zero: 0 },
      lowStockItems: 0,
      outOfStockItems: 0
    };
  }
}

// 상위 상품만 조회 (메모리 절약)
async function getTopProducts(supabase: any, tenantId: string, limit: number = 20) {
  try {
    console.log('=== 상위 상품 조회 시작 ===');
    console.log('테넌트 ID:', tenantId, '제한:', limit);
    
         // RPC 함수로 조회 후 클라이언트에서 필터링
     const { data: allItems, error } = await supabase
       .rpc('list_items', { _tenant_id: tenantId });
     
     if (error) {
       console.error('상위 상품 조회 에러:', error);
       throw error;
     }
     
     // 클라이언트에서 필터링 및 정렬
     const data = (allItems || [])
       .filter((item: any) => Number(item.qty || 0) >= 1)
       .sort((a: any, b: any) => Number(b.qty || 0) - Number(a.qty || 0))
       .slice(0, limit);

    console.log('상위 상품 쿼리 결과:', { data, error });

    if (error) {
      console.error('상위 상품 조회 에러:', error);
      throw error;
    }
    
    console.log('상위 상품 조회 결과:', data?.length || 0, '개');
    if (data && data.length > 0) {
      console.log('첫 번째 상품:', data[0]);
    }
    console.log('=== 상위 상품 조회 완료 ===');
    
    return data || [];
  } catch (error) {
    console.error('상위 상품 조회 실패:', error);
    return [];
  }
}

// 부족 재고 상품만 조회 (필요한 것만)
async function getLowStockProducts(supabase: any, tenantId: string, limit: number = 50) {
  try {
    console.log('=== 부족 재고 조회 시작 ===');
    console.log('테넌트 ID:', tenantId, '제한:', limit);
    
         // RPC 함수로 조회 후 클라이언트에서 필터링
     const { data: allItems, error } = await supabase
       .rpc('list_items', { _tenant_id: tenantId });
     
     if (error) {
       console.error('부족 재고 조회 에러:', error);
       throw error;
     }
     
     // 클라이언트에서 필터링 및 정렬
     const data = (allItems || [])
       .filter((item: any) => Number(item.qty || 0) < 10)
       .sort((a: any, b: any) => Number(a.qty || 0) - Number(b.qty || 0))
       .slice(0, limit);

    console.log('부족 재고 쿼리 결과:', { data, error });

    if (error) {
      console.error('부족 재고 조회 에러:', error);
      throw error;
    }
    
    console.log('부족 재고 조회 결과:', data?.length || 0, '개');
    console.log('=== 부족 재고 조회 완료 ===');
    
    return data || [];
  } catch (error) {
    console.error('부족 재고 조회 실패:', error);
    return [];
  }
}

// LLM 기반 의도 분석
async function analyzeQuestionWithLLM(question: string) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: '당신은 상품 재고 관리 전문가입니다. 사용자의 질문을 분석하여 다음 의도 중 하나로 분류하세요: inventory_analysis, product_analysis, trend_analysis, summary_overview. JSON 형식으로 응답하세요.'
        },
        {
          role: 'user',
          content: question
        }
      ],
      max_tokens: 100,
      temperature: 0.1
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      try {
        const parsed = JSON.parse(content);
        return { intent: parsed.intent, confidence: 0.95 };
      } catch {
        // JSON 파싱 실패 시 키워드 기반으로 추정
        return analyzeIntentLocally(question);
      }
    }
  } catch (error) {
    console.error('LLM 의도 분석 실패:', error);
  }
  
  return analyzeIntentLocally(question);
}

// 로컬 키워드 기반 의도 분석 (LLM 없이 작동)
function analyzeIntentLocally(question: string) {
  const lower = question.toLowerCase();
  
  // 1. 특정 상품 검색 (높은 우선순위)
  if (/(티셔츠|후드|모자|상의|하의|신발|가방|액세서리|red|blue|black)/i.test(question)) {
    return { intent: 'product_analysis', confidence: 0.95 };
  }
  
  // 2. 수량 관련 질문
  if (/(수량|개수|몇개|얼마나|재고|보유량|남은|현재수량)/i.test(question)) {
    return { intent: 'inventory_analysis', confidence: 0.9 };
  }
  
  // 3. 특정 상품명 검색
  if (/(red t|blue hood|black cap|상품명|제품명|바코드)/i.test(question)) {
    return { intent: 'product_analysis', confidence: 0.9 };
  }
  
  // 4. 전체/요약 질문
  if (/(전체|요약|대시보드|현황|개요|총|전부)/i.test(question)) {
    return { intent: 'summary_overview', confidence: 0.8 };
  }
  
  // 5. 기본값: 상품 분석 (가장 유용함)
  return { intent: 'product_analysis', confidence: 0.7 };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    const tenantId = String(body.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '');
    
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    // Safe SQL guard: SQL 인젝션 방지
    if (/select|insert|update|delete|drop|create|alter/i.test(question)) {
      return NextResponse.json({ 
        error: 'SQL queries are not allowed. Use natural language questions only.',
        hint: 'Try: "재고 현황", "상품별 수량", "전체 현황", "어떤 상품이 제일 많아?"'
      }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
    
         const supabase = createClient(url, serviceKey, { 
       db: { schema: 'public' }, // public 스키마에서 RPC 호출
       global: { headers: { 'X-Client-Info': 'joogo-ask-api' } }
     });

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT);

         try {
               // 로컬 키워드 기반 의도 분석 (LLM 없음 - 비용 절약)
        console.log('🔍 로컬 키워드 분석으로 의도 파악...');
        const analysis = analyzeIntentLocally(question);
      
      console.log('의도 분석 결과:', analysis);
      console.log('테넌트 ID:', tenantId);
      console.log('Supabase URL:', url);

                       // LLM 연결 테스트 제거됨 (비용 절약)
      console.log('💰 LLM 연결 테스트 건너뜀 (비용 절약)');

     // 데이터베이스 연결 테스트
     console.log('=== 데이터베이스 연결 테스트 ===');
     try {
       // RPC 함수로 테스트
       const { data: testData, error: testError } = await supabase
         .rpc('list_items', { _tenant_id: tenantId });
         
       console.log('테스트 쿼리 결과:', { data: testData, error: testError });
         
       if (testError) {
         console.error('테스트 쿼리 실패:', testError);
       } else {
         console.log('테스트 쿼리 성공');
       }
     } catch (testErr) {
       console.error('테스트 쿼리 예외:', testErr);
     }
     console.log('=== 데이터베이스 연결 테스트 완료 ===');

      // 의도에 따른 데이터 조회 및 응답 생성
      switch (analysis.intent) {
        case 'inventory_analysis':
          return await generateInventoryAnalysis(supabase, tenantId, question, analysis);
        
        case 'product_analysis':
          return await generateProductAnalysis(supabase, tenantId, question, analysis);
        
        case 'trend_analysis':
          return await generateTrendAnalysis(supabase, tenantId, question, analysis);
        
        default:
          return await generateSummaryOverview(supabase, tenantId, question, analysis);
      }

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (e: any) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ error: 'Query timeout exceeded (5s)' }, { status: 408 });
    }
    console.error('API 에러:', e);
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

// 재고 분석 응답 생성 (대용량 데이터 최적화)
async function generateInventoryAnalysis(supabase: any, tenantId: string, question: string, analysis: any) {
  // 집계 통계만 조회 (빠름)
  const stats = await getAggregatedStats(supabase, tenantId);
  
  // 상위 상품만 조회 (메모리 절약)
  const topProducts = await getTopProducts(supabase, tenantId, 20);
  
  // 부족 재고 상품만 조회 (필요한 것만)
  const lowStockProducts = await getLowStockProducts(supabase, tenantId, 50);

  // 간단한 인사이트 (LLM 호출 없음)
  const insight = `총 ${stats.totalProducts.toLocaleString()}개 상품, ${stats.totalQuantity.toLocaleString()}개 재고. 부족재고 ${stats.lowStockItems}개, 품절 ${stats.outOfStockItems}개.`;

  return NextResponse.json({
    intent: 'inventory_analysis',
    type: 'inventory',
    summary: '재고 현황 분석',
    analysis: analysis,
    insight: insight,
    data: {
      inventoryStats: stats,
      topProducts,
      lowStockProducts,
      // 전체 데이터는 전송하지 않음 (메모리 절약)
      totalItems: stats.totalProducts
    }
  });
}

// 상품 분석 응답 생성 (특정 상품 검색 포함)
async function generateProductAnalysis(supabase: any, tenantId: string, question: string, analysis: any) {
  // 집계 통계만 조회
  const stats = await getAggregatedStats(supabase, tenantId);
  
  // 상위 상품만 조회
  const topProducts = await getTopProducts(supabase, tenantId, 50);
  
  // 부족 수량 상품만 조회
  const lowQuantityProducts = await getLowStockProducts(supabase, tenantId, 30);

  // 특정 상품 검색 (질문에 포함된 키워드)
  const searchKeywords = extractSearchKeywords(question);
  const matchedProducts = searchKeywords.length > 0 
    ? topProducts.filter((product: any) => 
        searchKeywords.some(keyword => 
          product.product_name.toLowerCase().includes(keyword.toLowerCase())
        )
      )
    : [];

  // 인사이트 생성 (질문 의도에 따라 답변 수준 조절)
  let insight;
  if (matchedProducts.length > 0) {
    const product = matchedProducts[0];
    
    // 구체적인 수량 질문인지 확인
    if (/(몇개|수량|재고|개수|얼마나|보유량)/i.test(question)) {
      // 자연스러운 답변: "티셔츠 몇개?" → "5개 있습니다"
      insight = `${product.qty}개 있습니다`;
    } else {
      // 일반적인 답변: 상품명과 수량
      insight = `"${product.product_name}" 재고: ${product.qty}개`;
    }
  } else {
    const topProduct = topProducts[0];
    insight = `총 ${stats.totalProducts.toLocaleString()}개 상품, ${stats.totalQuantity.toLocaleString()}개 재고. 최고재고: ${topProduct?.product_name || 'N/A'} (${topProduct?.qty || 0}개).`;
  }

  return NextResponse.json({
    intent: 'product_analysis',
    type: 'products',
    summary: '상품별 분석',
    analysis: analysis,
    insight: insight,
    data: {
      productStats: stats,
      topProducts,
      lowQuantityProducts,
      matchedProducts, // 검색된 특정 상품
      totalProducts: stats.totalProducts
    }
  });
}

// 질문에서 검색 키워드 추출
function extractSearchKeywords(question: string): string[] {
  const keywords = [];
  const lower = question.toLowerCase();
  
  // 상품 타입 키워드
  if (lower.includes('티셔츠') || lower.includes('t-shirt') || lower.includes('t shirt')) keywords.push('t-shirt');
  if (lower.includes('후드') || lower.includes('hoodie') || lower.includes('hood')) keywords.push('hoodie');
  if (lower.includes('모자') || lower.includes('cap') || lower.includes('hat')) keywords.push('cap');
  
  // 색상 키워드
  if (lower.includes('red') || lower.includes('빨간') || lower.includes('빨강')) keywords.push('red');
  if (lower.includes('blue') || lower.includes('파란') || lower.includes('파랑')) keywords.push('blue');
  if (lower.includes('black') || lower.includes('검은') || lower.includes('검정')) keywords.push('black');
  
  return keywords;
}





// 추세 분석 응답 생성 (대용량 데이터 최적화)
async function generateTrendAnalysis(supabase: any, tenantId: string, question: string, analysis: any) {
  // 집계 통계만 조회
  const stats = await getAggregatedStats(supabase, tenantId);
  
  // 최근 업데이트된 상품만 조회 (최대 20개)
  const recentProducts = await getTopProducts(supabase, tenantId, 20);

  // 간단한 인사이트
  const insight = `재고분포: 높음(${stats.quantityDistribution.high}개), 보통(${stats.quantityDistribution.medium}개), 낮음(${stats.quantityDistribution.low}개), 품절(${stats.quantityDistribution.zero}개).`;

  return NextResponse.json({
    intent: 'trend_analysis',
    type: 'trends',
    summary: '추세 및 변화 분석',
    analysis: analysis,
    insight: insight,
    data: {
      quantityDistribution: stats.quantityDistribution,
      recentProducts,
      totalItems: stats.totalProducts,
      averageQuantity: stats.averageQuantity
    }
  });
}

// 전체 현황 요약 응답 생성 (대용량 데이터 최적화)
async function generateSummaryOverview(supabase: any, tenantId: string, question: string, analysis: any) {
  // 집계 통계만 조회
  const stats = await getAggregatedStats(supabase, tenantId);
  
  // 상위 상품만 조회
  const topProducts = await getTopProducts(supabase, tenantId, 30);

  // 간단한 인사이트
  const insight = `전체 ${stats.totalProducts.toLocaleString()}개 상품, ${stats.totalQuantity.toLocaleString()}개 재고. 평균 ${Math.round(stats.averageQuantity)}개/상품.`;

  return NextResponse.json({
    intent: 'summary_overview',
    type: 'overview',
    summary: '전체 현황 요약',
    analysis: analysis,
    insight: insight,
    data: {
      summaryStats: stats,
      topProducts,
      // 전체 상품 목록은 전송하지 않음 (메모리 절약)
      totalProducts: stats.totalProducts
    }
  });
}


