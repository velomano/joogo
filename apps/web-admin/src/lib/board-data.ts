import type { BoardDataSource, BoardSnapshot, KPI, DailyPoint, BreakdownRow, DateISO } from './BoardTypes';

const baseUrl = typeof window === 'undefined' ? (process.env.NEXT_PUBLIC_BASE_URL || '') : '';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export class MockBoardDataSource implements BoardDataSource {
  async fetchSnapshot(params: {
    from: DateISO;
    to: DateISO;
    channels?: string[];
    regions?: string[];
    skus?: string[];
    cuped?: boolean;
    pinCompare?: boolean;
  }): Promise<BoardSnapshot> {
    const { from, to } = params;
    const queryParams = new URLSearchParams({ from, to });

    // Fetch all data in parallel
    const [calendarData, channelRegionData, treemapData, funnelData] = await Promise.all([
      fetchJson<Array<{date: string; revenue: number; roas: number; is_event?: boolean}>>(
        `${baseUrl}/api/mock/cafe24?${queryParams}&kind=calendar`
      ),
      fetchJson<Array<{date: string; channel: string; region: string; revenue: number; roas: number}>>(
        `${baseUrl}/api/mock/cafe24?${queryParams}&kind=channel_region`
      ),
      fetchJson<Array<{category: string; sku: string; revenue: number; roas: number}>>(
        `${baseUrl}/api/mock/cafe24?${queryParams}&kind=treemap`
      ),
      fetchJson<Array<{stage: string; value: number; group: 'marketing'|'merchant'}>>(
        `${baseUrl}/api/mock/weather-ads?${queryParams}&kind=funnel`
      )
    ]);

    // Calculate KPIs
    const totalSales = calendarData.reduce((sum, item) => sum + item.revenue, 0);
    const totalOrders = Math.round(totalSales / 50000); // Rough estimate
    const avgRoas = calendarData.reduce((sum, item) => sum + item.roas, 0) / calendarData.length;
    const growthRate = 12.5; // Mock growth rate

    const kpis: KPI[] = [
      { label: '총 매출', value: totalSales, deltaPct: 8.2, help: '전월 대비 매출 증가율' },
      { label: '총 주문수', value: totalOrders, deltaPct: 5.1, help: '전월 대비 주문 증가율' },
      { label: '평균 ROAS', value: avgRoas, deltaPct: -2.3, help: '광고 투자 대비 수익률' },
      { label: '성장률', value: growthRate, deltaPct: 3.7, help: '전년 동기 대비 성장률' }
    ];

    // Transform daily data
    const daily: DailyPoint[] = calendarData.map(item => ({
      date: item.date,
      sales: item.revenue,
      orders: Math.round(item.revenue / 50000),
      roas: item.roas
    }));

    // Calculate channel breakdown
    const channelMap = new Map<string, { revenue: number; count: number }>();
    channelRegionData.forEach(item => {
      const existing = channelMap.get(item.channel) || { revenue: 0, count: 0 };
      channelMap.set(item.channel, {
        revenue: existing.revenue + item.revenue,
        count: existing.count + 1
      });
    });

    const byChannel: BreakdownRow[] = Array.from(channelMap.entries())
      .map(([channel, data]) => ({
        label: channel.toUpperCase(),
        value: data.revenue,
        deltaPct: Math.random() * 20 - 10 // Mock delta
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate region breakdown
    const regionMap = new Map<string, { revenue: number; count: number }>();
    channelRegionData.forEach(item => {
      const existing = regionMap.get(item.region) || { revenue: 0, count: 0 };
      regionMap.set(item.region, {
        revenue: existing.revenue + item.revenue,
        count: existing.count + 1
      });
    });

    const byRegion: BreakdownRow[] = Array.from(regionMap.entries())
      .map(([region, data]) => ({
        label: region,
        value: data.revenue,
        deltaPct: Math.random() * 20 - 10 // Mock delta
      }))
      .sort((a, b) => b.value - a.value);

    // Top SKUs
    const topSkus: BreakdownRow[] = treemapData
      .map(item => ({
        label: item.sku,
        value: item.revenue,
        deltaPct: Math.random() * 30 - 15 // Mock delta
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Mock insights
    const insights = [
      '🌡️ 날씨가 따뜻해지면서 상의류 매출이 15% 증가했습니다',
      '📱 모바일 채널의 전환율이 데스크톱 대비 23% 높습니다',
      '⚡ 1월 15일 이벤트로 인한 매출 급증이 관찰되었습니다',
      '📊 서울 지역이 전체 매출의 45%를 차지하고 있습니다'
    ];

    return {
      kpis,
      daily,
      byChannel,
      byRegion,
      topSkus,
      insights
    };
  }
}

export class SupabaseBoardDataSource implements BoardDataSource {
  async fetchSnapshot(params: {
    from: DateISO;
    to: DateISO;
    channels?: string[];
    regions?: string[];
    skus?: string[];
    cuped?: boolean;
    pinCompare?: boolean;
  }): Promise<BoardSnapshot> {
    // TODO: Implement Supabase RPC calls
    // - analytics.get_board_kpis(tenant_id, from, to, filters)
    // - analytics.get_daily_sales(tenant_id, from, to, filters)
    // - analytics.get_channel_breakdown(tenant_id, from, to, filters)
    // - analytics.get_region_breakdown(tenant_id, from, to, filters)
    // - analytics.get_top_skus(tenant_id, from, to, filters)
    // - analytics.get_insights(tenant_id, from, to, filters)
    
    throw new Error('SupabaseBoardDataSource not implemented yet');
  }
}

// Factory function to get the appropriate data source
export function getBoardDataSource(): BoardDataSource {
  const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE || 'mock';
  
  switch (dataSource) {
    case 'supabase':
      return new SupabaseBoardDataSource();
    case 'mock':
    default:
      return new MockBoardDataSource();
  }
}
