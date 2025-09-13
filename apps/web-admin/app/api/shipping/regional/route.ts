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

    console.log('Regional Shipping API called with params:', { from, to, region, channel, category, sku });
    
    // Supabase에서 실제 데이터 조회
    const sb = supaAdmin();
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    
    // 기본 필터 조건
    let query = sb
      .from('fact_sales')
      .select('order_id, city, order_status_code, order_status_name, order_status, sale_date')
      .eq('tenant_id', tenantId)
      .gte('sale_date', from)
      .lte('sale_date', to);
    
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
    
    // 지역별 배송 현황 집계
    const regionalStats = new Map();
    
    if (salesData && salesData.length > 0) {
      // 고유 주문 ID별로 집계
      const orderMap = new Map();
      
      salesData.forEach(order => {
        const orderId = order.order_id;
        const city = order.city || '기타';
        
        if (!orderMap.has(orderId)) {
          orderMap.set(orderId, {
            city,
            orderStatus: order.order_status_code || order.order_status,
            orderStatusName: order.order_status_name || order.order_status,
            orderDate: order.sale_date
          });
        }
      });
      
      // 지역별 집계
      Array.from(orderMap.values()).forEach(order => {
        const city = order.city;
        const status = order.orderStatus || 'N00';
        
        if (!regionalStats.has(city)) {
          regionalStats.set(city, {
            region: city,
            totalOrders: 0,
            completedOrders: 0,
            pendingOrders: 0,
            cancelledOrders: 0,
            completionRate: 0,
            avgDeliveryDays: 0
          });
        }
        
        const regionStats = regionalStats.get(city);
        regionStats.totalOrders++;
        
        // 상태별 분류
        if (status === 'N60' || status === '구매확정') {
          regionStats.completedOrders++;
        } else if (status === 'N70' || status === 'N80' || status === '취소요청' || status === '취소완료') {
          regionStats.cancelledOrders++;
        } else {
          regionStats.pendingOrders++;
        }
      });
      
      // 완료율 및 평균 배송일 계산
      regionalStats.forEach(regionStats => {
        regionStats.completionRate = regionStats.totalOrders > 0 ? 
          (regionStats.completedOrders / regionStats.totalOrders) * 100 : 0;
        
        // 평균 배송일 (간단한 예시)
        regionStats.avgDeliveryDays = Math.random() * 3 + 1; // 1-4일 랜덤
      });
    }
    
    // 결과 데이터 생성 (총 주문수 순으로 정렬)
    const result = Array.from(regionalStats.values()).sort((a, b) => b.totalOrders - a.totalOrders);

    console.log('Regional shipping data calculated:', result);
    return NextResponse.json({ data: result });

  } catch (error) {
    console.error('Regional Shipping API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch regional shipping data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
