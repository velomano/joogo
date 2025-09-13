import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    
    console.log('Customer Analytics API called with params:', { from, to });
    console.log('No data available - returning empty structure');
    
    // 데이터가 없으므로 빈 구조 반환
    return NextResponse.json({
      segments: [],
      summary: {
        totalCustomers: 0,
        totalRevenue: 0,
        totalOrders: 0,
        avgRevenuePerCustomer: 0,
        avgOrdersPerCustomer: '0.0',
        overallRetentionRate: '0.0',
        overallSatisfactionScore: '0.0'
      },
      insights: {
        topPerformingSegment: 'N/A',
        growthOpportunity: 'N/A',
        retentionFocus: 'N/A'
      },
      period: {
        from,
        to,
        days: Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    });
    
  } catch (error) {
    console.error('Customer Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch customer data' }, { status: 500 });
  }
}