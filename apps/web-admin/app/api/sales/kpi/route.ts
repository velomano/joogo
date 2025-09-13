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
    
    const mockData = {
      totalRevenue: Math.round(65000000 * baseMultiplier),
      totalQuantity: Math.round(1250 * baseMultiplier),
      totalOrders: Math.round(280 * baseMultiplier),
      avgOrderValue: 232142,
      conversionRate: 3.2,
      roas: 2.8,
      totalSpend: Math.round(23214285 * baseMultiplier),
      revenueGrowth: 12.5,
      quantityGrowth: 8.3,
      orderGrowth: 15.2,
      aovGrowth: -2.1,
      conversionGrowth: 5.7,
      roasGrowth: 18.9,
      period: {
        from,
        to,
        days: daysDiff
      }
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
