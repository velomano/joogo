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

    console.log('Shipping Status API called with params:', { from, to, region, channel, category, sku });
    
    // Supabase에서 실제 데이터 조회
    const sb = supaAdmin();
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    
    // 기본 필터 조건
    let query = sb
      .from('fact_sales')
      .select('order_id, shipping_status_code, shipping_status_name, order_status_code, order_status')
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
    
    // 배송 상태별 집계
    const statusMap = new Map();
    
    if (salesData && salesData.length > 0) {
      // 고유 주문 ID별로 집계
      const orderMap = new Map();
      
      salesData.forEach(order => {
        const orderId = order.order_id;
        if (!orderMap.has(orderId)) {
          // 배송 상태 우선, 없으면 주문 상태 사용
          const shippingStatus = order.shipping_status_code || order.shipping_status_name;
          const orderStatus = order.order_status_code || order.order_status;
          
          orderMap.set(orderId, {
            status: shippingStatus || orderStatus || 'N30',
            statusName: order.shipping_status_name || order.order_status || '배송준비중'
          });
        }
      });
      
      // 상태별 집계
      Array.from(orderMap.values()).forEach(order => {
        const status = order.status || 'N30';
        const statusName = order.statusName || '배송준비중';
        
        if (!statusMap.has(status)) {
          statusMap.set(status, {
            status,
            statusName,
            count: 0
          });
        }
        statusMap.get(status).count++;
      });
    }
    
    // 카페24 API 표준 배송 상태 정의
    const statusDefinitions = {
      'N20': { name: '상품준비중', color: '#f59e0b' },
      'N30': { name: '배송준비중', color: '#8b5cf6' },
      'N40': { name: '배송중', color: '#06b6d4' },
      'N50': { name: '배송완료', color: '#10b981' },
      'N60': { name: '구매확정', color: '#059669' },
      'N70': { name: '취소요청', color: '#ef4444' },
      'N80': { name: '취소완료', color: '#dc2626' },
      'N90': { name: '교환요청', color: '#f97316' },
      'N91': { name: '교환완료', color: '#ea580c' },
      'N98': { name: '반품요청', color: '#be123c' },
      'N99': { name: '반품완료', color: '#9f1239' }
    };
    
    // 결과 데이터 생성
    const result = Array.from(statusMap.values()).map(item => {
      const definition = statusDefinitions[item.status as keyof typeof statusDefinitions] || 
                       { name: item.statusName, color: '#6b7280' };
      
      return {
        status: item.status,
        statusName: definition.name,
        count: item.count,
        percentage: 0, // 전체 계산 후 설정
        color: definition.color
      };
    });
    
    // 전체 배송 수 계산
    const totalShipments = result.reduce((sum, item) => sum + item.count, 0);
    
    // 비율 계산
    result.forEach(item => {
      item.percentage = totalShipments > 0 ? (item.count / totalShipments) * 100 : 0;
    });
    
    // 카운트 순으로 정렬
    result.sort((a, b) => b.count - a.count);

    console.log('Shipping status data calculated:', result);
    return NextResponse.json({ data: result });

  } catch (error) {
    console.error('Shipping Status API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipping status data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
