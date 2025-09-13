import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 광고비 데이터 타입
interface AdSpendData {
  ts: string;
  channel: string;
  campaign_id: string;
  impressions: number;
  clicks: number;
  cost: number;
}


export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const channel = searchParams.get('channel') ?? undefined;
    
    console.log('Ads API 호출 (Supabase에서 조회):', { from, to, channel });
    
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    const sb = supaAdmin();
    
    // Supabase에서 광고 데이터 조회 (public.ads_data)
    let query = sb
      .from('ads_data')
      .select(`
        date,
        channel,
        spend,
        impressions,
        clicks,
        revenue,
        roas,
        ctr,
        cpc
      `)
      .eq('tenant_id', tenantId)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    // 채널 필터 적용
    if (channel) {
      query = query.eq('channel', channel);
    }

    const { data: marketingData, error: marketingError } = await query;
    
    if (marketingError) {
      console.error('Marketing data query error:', marketingError);
      // 데이터가 없으면 빈 배열 반환 (정상적인 상태)
      console.log('No marketing data available - returning empty array');
      return NextResponse.json([]);
    }

    // 일별 집계
    const dailyData = new Map();
    
    marketingData?.forEach(item => {
      const date = item.date;
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          date,
          cost: 0,
          spend: 0,
          impressions: 0,
          clicks: 0,
          revenue: 0,
          roas: 0,
          ctr: 0,
          cpc: 0,
          channels: new Set()
        });
      }
      
      const dayData = dailyData.get(date);
      dayData.cost += item.spend || 0;
      dayData.spend += item.spend || 0;
      dayData.impressions += item.impressions || 0;
      dayData.clicks += item.clicks || 0;
      dayData.revenue += item.revenue || 0;
      dayData.channels.add(item.channel);
    });

    // ROAS, CTR, CPC 계산
    const result = Array.from(dailyData.values()).map(dayData => {
      const roas = dayData.revenue > 0 && dayData.spend > 0 ? dayData.revenue / dayData.spend : 0;
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      const cpc = dayData.clicks > 0 ? dayData.spend / dayData.clicks : 0;

      return {
        date: dayData.date,
        cost: Math.round(dayData.cost),
        spend: Math.round(dayData.spend),
        impressions: dayData.impressions,
        clicks: dayData.clicks,
        revenue: Math.round(dayData.revenue),
        roas: Math.round(roas * 100) / 100,
        ctr: Math.round(ctr * 100) / 100,
        cpc: Math.round(cpc * 100) / 100
      };
    });
    
    console.log(`Supabase에서 가져온 광고 데이터 개수: ${result.length}`);
    
    // 응답 헤더에 상태 정보 추가
    const apiResponse = NextResponse.json(result);
    apiResponse.headers.set('X-API-Status', 'success');
    apiResponse.headers.set('X-Data-Source', 'supabase');
    
    return apiResponse;
    
  } catch (error) {
    console.error('Ads API 오류:', error);
    return NextResponse.json([]);
  }
}
