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

// Fallback 데이터 생성 (API 실패 시)
function generateFallbackData(from: string, to: string, channel?: string): AdSpendData[] {
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.ceil((+end - +start) / 86400000) + 1;
  
  const channels = channel ? [channel] : ['naver', 'coupang', 'google', 'meta'];
  const data: AdSpendData[] = [];
  
  // 시드 기반 랜덤 생성기 (일관된 데이터를 위해)
  function seedRand(seed: number) {
    let s = seed;
    return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  }
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(+start + i * 86400000);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // 요일별 변동 (주말에는 광고비 감소)
    const dayOfWeek = currentDate.getDay();
    const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.7 : 1.0;
    
    // 계절별 변동 (12월, 1월에 광고비 증가)
    const month = currentDate.getMonth();
    const seasonalMultiplier = (month === 11 || month === 0) ? 1.3 : 1.0;
    
    for (const ch of channels) {
      // 채널별 기본 광고비
      const baseCosts = {
        'naver': 150000,
        'coupang': 200000,
        'google': 300000,
        'meta': 100000
      };
      
      const baseCost = baseCosts[ch as keyof typeof baseCosts] || 150000;
      const rng = seedRand(i * 1000 + ch.charCodeAt(0));
      
      // 변동성 있는 광고비 계산
      const randomFactor = 0.7 + rng() * 0.6; // 0.7 ~ 1.3
      const cost = Math.round(
        baseCost * randomFactor * weekendMultiplier * seasonalMultiplier
      );
      
      // 노출수, 클릭수 계산
      const impressions = Math.round(cost * (80 + rng() * 40)); // 80-120 per 1원
      const ctr = 0.01 + rng() * 0.02; // 1-3% CTR
      const clicks = Math.round(impressions * ctr);
      
      data.push({
        ts: currentDate.toISOString(),
        channel: ch,
        campaign_id: `CAMP-${String(i % 3 + 1).padStart(3, '0')}`,
        impressions,
        clicks,
        cost
      });
    }
  }
  
  return data;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const channel = searchParams.get('channel') ?? undefined;
    
    console.log('Ads API 호출 (Mock 서버에서 조회):', { from, to, channel });
    
    // Mock-ads 서버에서 데이터 조회 (환경 변수 기반)
    const mockServerUrl = process.env.MOCK_ADS_URL || process.env.ADS_BASE_URL;
    
    // Mock 서버 URL이 설정되지 않은 경우 Supabase에서 직접 조회
    if (!mockServerUrl) {
      console.log('Mock 서버 URL이 설정되지 않음. Supabase에서 직접 조회');
      
      const { data: adsData, error } = await supaAdmin
        .from('ads_analysis')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase 조회 오류:', error);
        throw new Error(`Supabase 오류: ${error.message}`);
      }

      const formattedData = adsData?.map(item => ({
        date: item.date,
        channel: item.channel || 'unknown',
        spend: item.spend || 0,
        impressions: item.impressions || 0,
        clicks: item.clicks || 0
      })) || [];

      console.log(`Supabase에서 가져온 광고 데이터 개수: ${formattedData.length}`);

      const apiResponse = NextResponse.json(formattedData);
      apiResponse.headers.set('X-API-Status', 'success');
      apiResponse.headers.set('X-Data-Source', 'supabase');
      
      return apiResponse;
    }

    // Mock 서버가 설정된 경우
    const params = new URLSearchParams({
      from,
      to,
      ...(channel && { channel })
    });
    
    const response = await fetch(`${mockServerUrl}/api/v1/ads/spend?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mock-ads 서버 오류: ${response.status}`);
    }

    const data = await response.json();
    const adsData = data.points || [];
    
    console.log(`Mock 서버에서 가져온 광고 데이터 개수: ${adsData.length}`);
    
    // 응답 헤더에 상태 정보 추가
    const apiResponse = NextResponse.json(adsData);
    apiResponse.headers.set('X-API-Status', 'success');
    apiResponse.headers.set('X-Data-Source', 'mock-server');
    
    return apiResponse;
    
  } catch (error) {
    console.error('Ads API 오류:', error);
    
    // Mock 서버 오류 시 fallback 데이터
    const fallbackData = generateFallbackData(
      '2025-01-01',
      '2025-01-02',
      undefined
    );
    
    const response = NextResponse.json(fallbackData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'fallback');
    
    return response;
  }
}
