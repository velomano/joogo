import { NextRequest, NextResponse } from 'next/server';

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
    
    // 기간에 따른 동적 Mock 데이터 생성
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 기간에 비례한 데이터 생성
    const baseMultiplier = Math.max(1, daysDiff / 30); // 30일 기준으로 비례
    
    // 기간에 따른 동적 데이터 생성
    const totalRevenue = Math.round(65000000 * baseMultiplier);
    const totalQuantity = Math.round(1250 * baseMultiplier);
    const totalOrders = Math.round(280 * baseMultiplier);
    const avgOrderValue = 232142;
    const totalSpend = Math.round(23214285 * baseMultiplier);
    
    // 기간별 전월대비 성장률 (실제 비즈니스 로직에 맞게)
    let revenueGrowth, quantityGrowth, orderGrowth, aovGrowth, conversionGrowth, roasGrowth;
    let comparisonLabel = "전월대비";
    
    if (daysDiff <= 7) {
      // 1주일 이하: 전일대비
      revenueGrowth = 2.1;
      quantityGrowth = 1.8;
      orderGrowth = 2.3;
      aovGrowth = 0.5;
      conversionGrowth = 0.8;
      roasGrowth = 1.2;
      comparisonLabel = "전일대비";
    } else if (daysDiff <= 30) {
      // 1개월 이하: 전주대비
      revenueGrowth = 8.5;
      quantityGrowth = 7.2;
      orderGrowth = 9.1;
      aovGrowth = 1.8;
      conversionGrowth = 3.2;
      roasGrowth = 5.4;
      comparisonLabel = "전주대비";
    } else if (daysDiff <= 90) {
      // 3개월 이하: 전월대비
      revenueGrowth = 17.6;
      quantityGrowth = 13.6;
      orderGrowth = 14.9;
      aovGrowth = 3.2;
      conversionGrowth = 6.7;
      roasGrowth = 16.7;
      comparisonLabel = "전월대비";
    } else if (daysDiff <= 180) {
      // 6개월 이하: 전분기대비
      revenueGrowth = 28.4;
      quantityGrowth = 22.1;
      orderGrowth = 25.8;
      aovGrowth = 5.8;
      conversionGrowth = 12.3;
      roasGrowth = 31.2;
      comparisonLabel = "전분기대비";
    } else {
      // 1년 이하: 전반기대비
      revenueGrowth = 45.7;
      quantityGrowth = 38.9;
      orderGrowth = 42.3;
      aovGrowth = 9.8;
      conversionGrowth = 18.6;
      roasGrowth = 52.1;
      comparisonLabel = "전반기대비";
    }
    
    // 최고/최저 매출일 계산
    const peakDay = new Date(toDate);
    peakDay.setDate(toDate.getDate() - Math.floor(daysDiff * 0.3));
    const lowestDay = new Date(toDate);
    lowestDay.setDate(toDate.getDate() - Math.floor(daysDiff * 0.8));
    
    const mockData = {
      // 기본 매출 지표
      totalRevenue,
      totalQuantity,
      totalOrders,
      avgOrderValue,
      conversionRate: 3.2,
      roas: 2.8,
      totalSpend,
      
      // 성장률 지표 (고정값 - 전월대비)
      revenueGrowth,
      quantityGrowth,
      orderGrowth,
      aovGrowth,
      conversionGrowth,
      roasGrowth,
      
      // 일일 평균 지표
      dailyAvgRevenue: Math.round(totalRevenue / daysDiff),
      dailyAvgOrders: Math.round(totalOrders / daysDiff),
      dailyAvgQuantity: Math.round(totalQuantity / daysDiff),
      
      // 최고/최저 매출일
      peakRevenueDay: peakDay.toISOString().split('T')[0],
      peakRevenueAmount: Math.round(totalRevenue * 1.5),
      lowestRevenueDay: lowestDay.toISOString().split('T')[0],
      lowestRevenueAmount: Math.round(totalRevenue * 0.3),
      
      // 고객 관련 지표
      repeatCustomerRate: 35.2,
      newCustomerRate: 64.8,
      customerLifetimeValue: Math.round(avgOrderValue * 2.5),
      
      // 장바구니 및 반품 지표
      cartAbandonmentRate: 68.5,
      returnRate: 8.2,
      refundRate: 3.1,
      
      // 수익성 지표
      netRevenue: Math.round(totalRevenue * 0.92), // 8% 반품/환불 제외
      grossMargin: 45.8,
      operatingMargin: 12.3,
      
      // 재고 및 물류 지표
      inventoryTurnover: 6.2,
      stockoutRate: 2.1,
      fulfillmentRate: 98.7,
      avgDeliveryTime: 2.3,
      
      // 고객 만족도
      customerSatisfactionScore: 4.2,
      
      period: {
        from,
        to,
        days: daysDiff
      },
      comparisonLabel
    };

    console.log('Returning mock data:', mockData);
    return NextResponse.json(mockData);

  } catch (error) {
    console.error('Sales KPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales KPI data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
