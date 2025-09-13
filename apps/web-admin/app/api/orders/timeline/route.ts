import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const region = searchParams.get('region');
    const channel = searchParams.get('channel');
    const category = searchParams.get('category');
    const sku = searchParams.get('sku');

    console.log('Order Timeline API called with params:', { from, to, region, channel, category, sku });
    
    // Supabase에서 실제 데이터 조회
    const sb = supaAdmin();
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    
    // 기본 필터 조건
    let query = sb
      .from('fact_sales')
      .select('order_id, sale_date, order_status_code, order_status_name, order_status')
      .eq('tenant_id', tenantId)
      .gte('sale_date', from)
      .lte('sale_date', to)
      .order('sale_date', { ascending: true });
    
    // 추가 필터 적용
    if (region) {
      query = query.in('city', region.split(','));
    }
    if (channel) {
      query = query.in('channel', channel.split(','));
    }
    if (category) {
      query = query.in('category', category.split(','));
    }
    if (sku) {
      query = query.in('sku', sku.split(','));
    }
    
    const { data: salesData, error: salesError } = await query;
    
    if (salesError) {
      console.error('Sales data error:', salesError);
      return NextResponse.json({ data: [] });
    }
    
    // 일별 주문 현황 집계
    const dailyStats = new Map();
    
    if (salesData && salesData.length > 0) {
      // 고유 주문 ID별로 집계
      const orderMap = new Map();
      
      salesData.forEach(order => {
        const orderId = order.order_id;
        const orderDate = order.sale_date;
        
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            orderDate,
            orderStatus: order.order_status_code || order.order_status,
            orderStatusName: order.order_status_name || order.order_status
          });
        }
      });
      
      // 일별 집계
      Array.from(orderMap.values()).forEach(order => {
        const date = order.orderDate;
        const status = order.orderStatus || 'N00';
        
        if (!dailyStats.has(date)) {
          dailyStats.set(date, {
            date,
            orders: 0,
            completed: 0,
            cancelled: 0,
            pending: 0
          });
        }
        
        const dayStats = dailyStats.get(date);
        dayStats.orders++;
        
        // 상태별 분류
        if (status === 'N60' || status === '구매확정') {
          dayStats.completed++;
        } else if (status === 'N70' || status === 'N80' || status === '취소요청' || status === '취소완료') {
          dayStats.cancelled++;
        } else {
          dayStats.pending++;
        }
      });
    }
    
    // 결과 데이터 생성 (날짜 순으로 정렬)
    const result = Array.from(dailyStats.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    console.log('Order timeline data calculated:', result);
    return NextResponse.json({ data: result });

  } catch (error) {
    console.error('Order Timeline API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order timeline data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
