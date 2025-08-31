import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    
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
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-daily' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id: tenantId });
    
    let query = supabase
      .from('core.daily_sales')
      .select(`
        id,
        date,
        daily_qty,
        products!inner(
          상품코드,
          상품명,
          상품분류
        )
      `)
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
    
    // 날짜 필터 적용
    if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate);
    } else {
      // 기본적으로 최근 N일
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      query = query.gte('date', startDate.toISOString().split('T')[0])
                   .lte('date', endDate.toISOString().split('T')[0]);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // 데이터 가공
    const processedData = data?.map((item: any) => ({
      id: item.id,
      date: item.date,
      daily_qty: item.daily_qty,
      product_code: item.products?.상품코드,
      product_name: item.products?.상품명,
      category: item.products?.상품분류
    })) || [];
    
    // 일별 집계
    const dailyAggregated = processedData.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          total_qty: 0,
          product_count: 0,
          categories: new Set()
        };
      }
      
      acc[date].total_qty += item.daily_qty || 0;
      acc[date].product_count += 1;
      if (item.category) {
        acc[date].categories.add(item.category);
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // 배열로 변환하고 정렬
    const result = Object.values(dailyAggregated)
      .map(item => ({
        ...item,
        categories: Array.from(item.categories)
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('일별 판매 데이터 조회 오류:', error);
    return NextResponse.json({ 
      error: '일별 판매 데이터 조회 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}

// POST 요청 - 일별 데이터 일괄 업데이트
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenant_id, daily_data } = body;
    
    if (!tenant_id || !daily_data || !Array.isArray(daily_data)) {
      return NextResponse.json({ error: '잘못된 요청 데이터입니다' }, { status: 400 });
    }
    
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase 설정이 누락되었습니다' }, { status: 500 });
    }
    
    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-sales-analysis-daily-update' } }
    });
    
    // 테넌트 설정
    await supabase.rpc('set_tenant_id', { tenant_id });
    
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // 배치 처리
    for (const item of daily_data) {
      try {
        const { error } = await supabase.rpc('update_daily_sales', {
          p_product_id: item.product_id,
          p_tenant_id: tenant_id,
          p_date: item.date,
          p_qty: item.qty || 0
        });
        
        if (error) {
          errorCount++;
          errors.push(`상품 ${item.product_id}, 날짜 ${item.date}: ${error.message}`);
        } else {
          successCount++;
        }
      } catch (error: any) {
        errorCount++;
        errors.push(`상품 ${item.product_id}, 날짜 ${item.date}: ${error.message}`);
      }
    }
    
    return NextResponse.json({
      message: '일별 판매 데이터 업데이트가 완료되었습니다',
      summary: {
        total: daily_data.length,
        success: successCount,
        error: errorCount,
        errors: errors.slice(0, 10)
      }
    });
    
  } catch (error: any) {
    console.error('일별 데이터 업데이트 오류:', error);
    return NextResponse.json({ 
      error: '일별 데이터 업데이트 중 오류가 발생했습니다',
      details: error.message 
    }, { status: 500 });
  }
}








