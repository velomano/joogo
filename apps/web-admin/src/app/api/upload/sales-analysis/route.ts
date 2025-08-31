import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



// CSV 파싱 함수
function parseCSV(csvText: string): any[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      let value = values[index] || '';
      
      // 따옴표 제거
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      // 숫자 변환
      if (header.includes('가') || header.includes('수량') || header.includes('고')) {
        const num = parseFloat(value);
        row[header] = isNaN(num) ? 0 : num;
      } else if (header.includes('일자')) {
        // 날짜 변환 (2024-10-16 오후 3:09:00 -> 2024-10-16)
        const dateMatch = value.match(/(\d{4}-\d{2}-\d{2})/);
        row[header] = dateMatch ? dateMatch[1] : value;
      } else {
        row[header] = value;
      }
    });
    
    return row;
  });
}

// 일별 데이터 컬럼 추출
function extractDailyColumns(headers: string[]): string[] {
  return headers.filter(header => /^\d{8}$/.test(header));
}

// 데이터 검증
function validateData(row: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!row.상품코드) errors.push('상품코드가 없습니다');
  if (!row.상품명) errors.push('상품명이 없습니다');
  if (!row.옵션코드) errors.push('옵션코드가 없습니다');
  
  if (typeof row.현재고 !== 'number') errors.push('현재고는 숫자여야 합니다');
  if (typeof row.주문수 !== 'number') errors.push('주문수는 숫자여야 합니다');
  if (typeof row.발송수 !== 'number') errors.push('발송수는 숫자여야 합니다');
  
  return {
    valid: errors.length === 0,
    errors
  };
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenant_id') as string;
    
    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id가 필요합니다' }, { status: 400 });
    }
    
    // 파일 확장자 검증
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSV 파일만 업로드 가능합니다' }, { status: 400 });
    }
    
    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 });
    }
    
    // CSV 파일 읽기
    const csvText = await file.text();
    const rows = parseCSV(csvText);
    const headers = Object.keys(rows[0] || {});
    const dailyColumns = extractDailyColumns(headers);
    
    console.log(`📊 CSV 파싱 완료: ${rows.length}개 행, ${headers.length}개 컬럼`);
    console.log(`📅 일별 데이터 컬럼: ${dailyColumns.length}개`);
    
    // Supabase 연결
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase 설정이 누락되었습니다' }, { status: 500 });
    }
    
    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-upload' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id: tenantId });
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // 배치 처리 (100개씩)
    const batchSize = 100;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          // 데이터 검증
          const validation = validateData(row);
          if (!validation.valid) {
            errorCount++;
            errors.push(`행 ${i + 1}: ${validation.errors.join(', ')}`);
            continue;
          }
          
          // 상품 데이터 업로드
          const { data: productData, error: productError } = await supabase.rpc('upsert_product', {
            p_tenant_id: tenantId,
            p_상품코드: row.상품코드,
            p_옵션코드: row.옵션코드,
            p_data: row
          });
          
          if (productError) {
            console.error('상품 업로드 오류:', productError);
            errorCount++;
            errors.push(`행 ${i + 1}: 상품 업로드 실패 - ${productError.message}`);
            continue;
          }
          
          // 일별 데이터 업로드
          for (const dateColumn of dailyColumns) {
            const date = dateColumn.replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            const qty = row[dateColumn] || 0;
            
            if (qty > 0) {
              const { error: dailyError } = await supabase.rpc('update_daily_sales', {
                p_product_id: productData,
                p_tenant_id: tenantId,
                p_date: date,
                p_qty: qty
              });
              
              if (dailyError) {
                console.error('일별 데이터 업로드 오류:', dailyError);
              }
            }
          }
          
          successCount++;
          
        } catch (error: any) {
          errorCount++;
          errors.push(`행 ${i + 1}: ${error.message}`);
        }
      }
      
      // 진행률 로깅
      if (i % 500 === 0) {
        console.log(`📈 진행률: ${Math.round((i / rows.length) * 100)}%`);
      }
    }
    
    // 결과 요약
    const summary = {
      totalRows: rows.length,
      successCount,
      errorCount,
      dailyColumnsCount: dailyColumns.length,
      errors: errors.slice(0, 10) // 최대 10개 오류만 반환
    };
    
    console.log('✅ 업로드 완료:', summary);
    
    return NextResponse.json({
      message: '판매 분석 데이터 업로드가 완료되었습니다',
      summary
    });
    
  } catch (error: any) {
    console.error('업로드 API 오류:', error);
    return NextResponse.json({ 
      error: '업로드 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}

// GET 요청 - 업로드 상태 확인
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');
    
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id가 필요합니다' }, { status: 400 });
    }
    
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase 설정이 누락되었습니다' }, { status: 500 });
    }
    
    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-status' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id: tenantId });
    
    // 통계 조회
    const { data: products, error: productsError } = await supabase
      .from('core.products')
      .select('id, 상품코드, 상품명, 현재고, 주문수, 발송수')
      .eq('tenant_id', tenantId);
    
    if (productsError) {
      throw productsError;
    }
    
    const { data: dailySales, error: dailyError } = await supabase
      .from('core.daily_sales')
      .select('id, date, daily_qty')
      .eq('tenant_id', tenantId);
    
    if (dailyError) {
      throw dailyError;
    }
    
    const summary = {
      totalProducts: products?.length || 0,
      totalDailyRecords: dailySales?.length || 0,
      latestUpdate: products?.[0] ? (products[0] as any).updated_at || null : null,
      sampleProducts: products?.slice(0, 5) || []
    };
    
    return NextResponse.json(summary);
    
  } catch (error: any) {
    console.error('상태 확인 오류:', error);
    return NextResponse.json({ 
      error: '상태 확인 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}








