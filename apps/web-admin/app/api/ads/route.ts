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

// Fallback 데이터 생성 (API 실패 시) - 주간 단위로 생성
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
  
  // 주간 단위로 광고비 생성 (매주 월요일에만 생성)
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(+start + i * 86400000);
    const dayOfWeek = currentDate.getDay();
    
    // 월요일(1)에만 광고비 데이터 생성
    if (dayOfWeek !== 1) continue;
    
    // 계절별 변동 (12월, 1월에 광고비 증가)
    const month = currentDate.getMonth();
    const seasonalMultiplier = (month === 11 || month === 0) ? 1.3 : 1.0;
    
    for (const ch of channels) {
      // 채널별 기본 광고비 (주간 단위로 증가)
      const baseCosts = {
        'naver': 800000,    // 주간 광고비
        'coupang': 1200000,
        'google': 1500000,
        'meta': 600000
      };
      
      const baseCost = baseCosts[ch as keyof typeof baseCosts] || 800000;
      const rng = seedRand(Math.floor(i / 7) * 1000 + ch.charCodeAt(0)); // 주간 시드
      
      // 변동성 있는 광고비 계산 (주간 단위)
      const randomFactor = 0.6 + rng() * 0.8; // 0.6 ~ 1.4 (더 큰 변동)
      const cost = Math.round(
        baseCost * randomFactor * seasonalMultiplier
      );
      
      // 노출수, 클릭수 계산 (주간 단위)
      const impressions = Math.round(cost * (60 + rng() * 40)); // 60-100 per 1원
      const ctr = 0.008 + rng() * 0.015; // 0.8-2.3% CTR
      const clicks = Math.round(impressions * ctr);
      
      data.push({
        ts: currentDate.toISOString(),
        channel: ch,
        campaign_id: `CAMP-${String(Math.floor(i / 7) % 4 + 1).padStart(3, '0')}`, // 주간별 캠페인
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
    
    // Mock 서버 URL이 설정되지 않은 경우 Fallback 데이터 생성
    if (!mockServerUrl) {
      console.log('Mock 서버 URL이 설정되지 않음. Fallback 데이터 생성');
      
      const fallbackData = generateFallbackData(from, to, channel);
      console.log(`Fallback으로 생성된 광고 데이터 개수: ${fallbackData.length}`);

      const apiResponse = NextResponse.json(fallbackData);
      apiResponse.headers.set('X-API-Status', 'success');
      apiResponse.headers.set('X-Data-Source', 'fallback');
      
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
