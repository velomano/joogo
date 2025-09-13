import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Sales KPI API called');
    
    // 간단한 Mock 데이터 반환
    const mockData = {
      totalRevenue: 65000000,
      totalQuantity: 1250,
      totalOrders: 280,
      avgOrderValue: 232142,
      conversionRate: 3.2,
      roas: 2.8,
      totalSpend: 23214285,
      revenueGrowth: 12.5,
      quantityGrowth: 8.3,
      orderGrowth: 15.2,
      aovGrowth: -2.1,
      conversionGrowth: 5.7,
      roasGrowth: 18.9,
      period: {
        from: '2025-01-01',
        to: '2025-01-31',
        days: 31
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
