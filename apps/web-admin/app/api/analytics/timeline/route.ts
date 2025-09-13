import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const granularity = searchParams.get('granularity') || 'hour';
    
    console.log('Timeline Analytics API called with params:', { from, to, granularity });
    console.log('No data available - returning empty structure');
    
    // 데이터가 없으므로 빈 구조 반환
    return NextResponse.json({
      data: [],
      summary: {
        totalRevenue: 0,
        totalOrders: 0,
        totalVisitors: 0,
        avgRevenue: 0,
        avgOrders: 0,
        avgVisitors: 0,
        avgConversionRate: '0.0',
        peakRevenue: 0,
        peakOrders: 0,
        peakVisitors: 0
      },
      insights: {
        bestPerformingTime: {
          timestamp: '',
          revenue: 0,
          orders: 0,
          visitors: 0,
          conversionRate: 0,
          avgOrderValue: 0
        },
        worstPerformingTime: {
          timestamp: '',
          revenue: 0,
          orders: 0,
          visitors: 0,
          conversionRate: 0,
          avgOrderValue: 0
        },
        trend: 'N/A'
      },
      period: {
        from,
        to,
        days: Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1,
        granularity
      }
    });
    
  } catch (error) {
    console.error('Timeline Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch timeline data' }, { status: 500 });
  }
}