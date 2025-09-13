import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    
    console.log('Price Range Analytics API called with params:', { from, to });
    console.log('No data available - returning empty structure');
    
    // 데이터가 없으므로 빈 구조 반환
    return NextResponse.json({
      summary: {
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        topPriceRange: 'N/A'
      },
      priceRanges: [],
      insights: {
        topPerformer: 'N/A',
        opportunity: 'N/A'
      }
    });
    
  } catch (error) {
    console.error('Price Range Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch price range data' }, { status: 500 });
  }
}