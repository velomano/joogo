import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');
    const limit = parseInt(searchParams.get('limit') || '100000');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sort_by') || '주문수';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
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
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-main' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id: tenantId });
    
    // 기본 쿼리
    let query = supabase
      .from('core.products')
      .select(`
        id,
        상품코드,
        상품명,
        상품등록일자,
        공급처명,
        상품분류,
        옵션내용,
        원가,
        판매가,
        품절여부,
        안정재고,
        현재고,
        주문금액,
        주문수,
        발송수,
        발송금액,
        미발송수,
        입고수량,
        출고수량,
        부족수량,
        주문단가,
        취소주문수,
        반품주문수,
        상품메모,
        created_at,
        updated_at
      `)
      .eq('tenant_id', tenantId);
    
    // 카테고리 필터
    if (category && category !== 'all') {
      query = query.eq('상품분류', category);
    }
    
    // 검색 필터
    if (search) {
      query = query.or(`상품명.ilike.%${search}%,상품코드.ilike.%${search}%`);
    }
    
    // 정렬
    if (sortBy && ['주문수', '발송수', '현재고', '판매가', '원가'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      query = query.order('주문수', { ascending: false });
    }
    
    // 제한
    query = query.limit(limit);
    
    const { data: products, error: productsError } = await query;
    
    // 타입 안전성을 위한 타입 가드
    if (!products || !Array.isArray(products)) {
      throw new Error('Invalid products data');
    }
    
    if (productsError) {
      throw productsError;
    }
    
    // 통계 계산
    const totalProducts = products?.length || 0;
    const totalRevenue = products?.reduce((sum, p: any) => sum + (p.판매가 * p.발송수), 0) || 0;
    const totalCost = products?.reduce((sum, p: any) => sum + (p.원가 * p.발송수), 0) || 0;
    const totalProfit = totalRevenue - totalCost;
    const outOfStockCount = products?.filter((p: any) => p.현재고 <= 0).length || 0;
    const lowStockCount = products?.filter((p: any) => p.현재고 > 0 && p.현재고 <= 10).length || 0;
    
    // 카테고리별 통계
    const categoryStats = products?.reduce((acc, p: any) => {
      const category = p.상품분류 || '미분류';
      if (!acc[category]) {
        acc[category] = {
          count: 0,
          totalRevenue: 0,
          totalCost: 0,
          totalOrders: 0
        };
      }
      
      acc[category].count++;
      acc[category].totalRevenue += p.판매가 * p.발송수;
      acc[category].totalCost += p.원가 * p.발송수;
      acc[category].totalOrders += p.주문수;
      
      return acc;
    }, {} as Record<string, any>) || {};
    
    // 공급처별 통계
    const supplierStats = products?.reduce((acc, p: any) => {
      const supplier = p.공급처명 || '미지정';
      if (!acc[supplier]) {
        acc[supplier] = {
          count: 0,
          totalRevenue: 0,
          totalCost: 0
        };
      }
      
      acc[supplier].count++;
      acc[supplier].totalRevenue += p.판매가 * p.발송수;
      acc[supplier].totalCost += p.원가 * p.발송수;
      
      return acc;
    }, {} as Record<string, any>) || {};
    
    // 응답 데이터 구성
    const response = {
      summary: {
        totalProducts,
        totalRevenue,
        totalCost,
        totalProfit,
        profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
        outOfStockCount,
        lowStockCount,
        averagePrice: totalProducts > 0 ? totalRevenue / totalProducts : 0,
        averageCost: totalProducts > 0 ? totalCost / totalProducts : 0
      },
      categoryStats: Object.entries(categoryStats).map(([category, stats]) => ({
        category,
        ...stats,
        profit: stats.totalRevenue - stats.totalCost,
        profitMargin: stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalCost) / stats.totalRevenue) * 100 : 0
      })),
      supplierStats: Object.entries(supplierStats).map(([supplier, stats]) => ({
        supplier,
        ...stats,
        profit: stats.totalRevenue - stats.totalCost,
        profitMargin: stats.totalRevenue > 0 ? ((stats.totalRevenue - stats.totalCost) / stats.totalRevenue) * 100 : 0
      })),
      products: products?.map((p: any) => ({
        ...p,
        마진: p.판매가 - p.원가,
        마진율: p.판매가 > 0 ? ((p.판매가 - p.원가) / p.판매가) * 100 : 0,
        재고상태: p.현재고 <= 0 ? '품절' : p.현재고 <= (p.안정재고 || 10) ? '부족' : '충분'
      })) || [],
      latestUpdate: products?.[0] ? (products[0] as any).updated_at || null : null
    };
    
    return NextResponse.json(response);
    
  } catch (error: any) {
    console.error('판매 분석 데이터 조회 오류:', error);
    return NextResponse.json({ 
      error: '판매 분석 데이터 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}

// POST 요청 - 상품 데이터 일괄 업데이트
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenant_id, products_data } = body;
    
    if (!tenant_id || !products_data || !Array.isArray(products_data)) {
      return NextResponse.json({ error: '잘못된 요청 데이터입니다' }, { status: 400 });
    }
    
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase 설정이 누락되었습니다' }, { status: 500 });
    }
    
    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-update' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id });
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // 배치 처리
    for (const product of products_data) {
      try {
        const { data, error } = await supabase.rpc('upsert_product', {
          p_tenant_id: tenant_id,
          p_상품코드: product.상품코드,
          p_옵션코드: product.옵션코드,
          p_data: product
        });
        
        if (error) {
          errorCount++;
          errors.push(`상품 ${product.상품코드}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`상품 ${product.상품코드}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: '상품 데이터 업데이트가 완료되었습니다',
      summary: {
        total: products_data.length,
        success: successCount,
        error: errorCount,
        errors: errors.slice(0, 10)
      }
    });
    
  } catch (error: any) {
    console.error('상품 데이터 업데이트 오류:', error);
    return NextResponse.json({ 
      error: '상품 데이터 업데이트 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}








