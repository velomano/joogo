import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    
    console.log('Channel Analytics API called with params:', { from, to });
    console.log('No data available - returning empty structure');
    
    // 데이터가 없으므로 빈 구조 반환
    return NextResponse.json({
      channels: [],
      summary: {
        totalRevenue: 0,
        totalOrders: 0,
        totalVisitors: 0,
        avgConversionRate: '0.0',
        avgRoas: '0.0'
      },
      period: {
        from,
        to,
        days: Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1
      }
    });
    
  } catch (error) {
    console.error('Channel Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch channel data' }, { status: 500 });
  }
}