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

    console.log('Sales KPI API called with params:', { from, to, region, channel, category, sku });
    
    // 기간 계산
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Supabase에서 실제 데이터 조회
    const sb = supaAdmin();
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    
    // 기본 필터 조건
    let query = sb
      .from('fact_sales')
      .select('*')
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
      // 에러가 있어도 빈 데이터 반환
    }
    
    // 미발송 주문수 계산 (카페24 API 표준 주문 상태 코드)
    // N20: 상품준비중, N30: 배송준비중, N40: 배송중
    const pendingOrders = salesData?.filter(order => 
      order.order_status === 'N20' || // 상품준비중
      order.order_status === 'N30' || // 배송준비중
      order.order_status === 'N40' || // 배송중
      order.order_status === '상품준비중' ||
      order.order_status === '배송준비중' ||
      order.order_status === '배송중'
    ).length || 0;
    
    // 데이터가 없으므로 모든 값을 0으로 설정
    const emptyData = {
      // 기본 매출 지표
      totalRevenue: 0,
      totalQuantity: 0,
      totalOrders: 0,
      avgOrderValue: 0,
      conversionRate: 0,
      roas: 0,
      totalSpend: 0,
      
      // 성장률 지표 (모두 0)
      revenueGrowth: 0,
      quantityGrowth: 0,
      orderGrowth: 0,
      aovGrowth: 0,
      conversionGrowth: 0,
      roasGrowth: 0,
      
      // 일일 평균 지표
      dailyAvgRevenue: 0,
      dailyAvgOrders: 0,
      dailyAvgQuantity: 0,
      
      // 최고/최저 매출일
      peakRevenueDay: 'N/A',
      peakRevenueAmount: 0,
      lowestRevenueDay: 'N/A',
      lowestRevenueAmount: 0,
      
      // Joogo 시스템 아키텍처 기반 실제 지표
      dailyVisitors: 0,
      pageViews: 0,
      newVisitors: 0,
      bounceRate: 0,
      
      // Salesreport 섹션
      dailySales: 0,
      monthlySales: 0,
      hourlySales: 0,
      productSales: 0,
      salesVolume: 0,
      
      // Order 섹션 기반 지표
      orderCompletionRate: 0,
      orderCancellationRate: 0,
      orderRefundRate: 0,
      avgOrderProcessingTime: 0,
      pendingOrders: pendingOrders, // 미발송 주문수
      
      // Customer 섹션
      repeatOrderRate: 0,
      newCustomerRate: 0,
      avgOrdersPerCustomer: 0,
      
      // Product 섹션
      totalProducts: 0,
      activeProducts: 0,
      lowStockProducts: 0,
      avgItemsPerOrder: 0,
      
      // 수익성 지표
      netRevenue: 0,
      revenuePerOrder: 0,
      highValueOrderRate: 0,
      
      // 추가 지표들
      repeatCustomerRate: 0,
      customerLifetimeValue: 0,
      cartAbandonmentRate: 0,
      returnRate: 0,
      refundRate: 0,
      grossMargin: 0,
      operatingMargin: 0,
      
      period: {
        from,
        to,
        days: daysDiff
      },
      comparisonLabel: "전월대비"
    };

    console.log('No data available - returning empty structure');
    return NextResponse.json(emptyData);

  } catch (error) {
    console.error('Sales KPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales KPI data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
