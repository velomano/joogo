import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    
    console.log('Channel Analytics API called with params:', { from, to });
    
    // 기간 계산
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Joogo 시스템 아키텍처 기반 채널별 데이터
    // Order 섹션의 sales_channels 기반
    const channels = [
      {
        channel: 'web',
        name: '웹사이트',
        revenue: Math.round(65000000 * daysDiff * 0.4), // 40%
        orders: Math.round(280 * daysDiff * 0.4),
        visitors: Math.round(1250 * daysDiff * 0.4),
        conversionRate: 3.2,
        avgOrderValue: 232142,
        roas: 2.8,
        spend: Math.round(23214285 * daysDiff * 0.4)
      },
      {
        channel: 'mobile',
        name: '모바일 앱',
        revenue: Math.round(65000000 * daysDiff * 0.35), // 35%
        orders: Math.round(280 * daysDiff * 0.35),
        visitors: Math.round(1250 * daysDiff * 0.35),
        conversionRate: 4.1,
        avgOrderValue: 198000,
        roas: 3.2,
        spend: Math.round(23214285 * daysDiff * 0.35)
      },
      {
        channel: 'kiosk',
        name: '키오스크',
        revenue: Math.round(65000000 * daysDiff * 0.15), // 15%
        orders: Math.round(280 * daysDiff * 0.15),
        visitors: Math.round(1250 * daysDiff * 0.15),
        conversionRate: 8.5,
        avgOrderValue: 185000,
        roas: 4.1,
        spend: Math.round(23214285 * daysDiff * 0.15)
      },
      {
        channel: 'social',
        name: '소셜미디어',
        revenue: Math.round(65000000 * daysDiff * 0.1), // 10%
        orders: Math.round(280 * daysDiff * 0.1),
        visitors: Math.round(1250 * daysDiff * 0.1),
        conversionRate: 2.1,
        avgOrderValue: 165000,
        roas: 1.8,
        spend: Math.round(23214285 * daysDiff * 0.1)
      }
    ];
    
    // 채널별 성과 지표 계산
    const totalRevenue = channels.reduce((sum, channel) => sum + channel.revenue, 0);
    const totalOrders = channels.reduce((sum, channel) => sum + channel.orders, 0);
    const totalVisitors = channels.reduce((sum, channel) => sum + channel.visitors, 0);
    
    const channelAnalytics = {
      channels: channels.map(channel => ({
        ...channel,
        revenueShare: ((channel.revenue / totalRevenue) * 100).toFixed(1),
        orderShare: ((channel.orders / totalOrders) * 100).toFixed(1),
        visitorShare: ((channel.visitors / totalVisitors) * 100).toFixed(1),
        efficiency: (channel.conversionRate * channel.avgOrderValue / 1000).toFixed(1) // 효율성 점수
      })),
      summary: {
        totalRevenue,
        totalOrders,
        totalVisitors,
        avgConversionRate: (channels.reduce((sum, channel) => sum + channel.conversionRate, 0) / channels.length).toFixed(1),
        avgRoas: (channels.reduce((sum, channel) => sum + channel.roas, 0) / channels.length).toFixed(1)
      },
      period: {
        from,
        to,
        days: daysDiff
      }
    };
    
    console.log('Returning channel analytics:', channelAnalytics);
    return NextResponse.json(channelAnalytics);
    
  } catch (error) {
    console.error('Channel Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channel analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}