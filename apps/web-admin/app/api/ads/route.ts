import { NextResponse } from 'next/server';

export const runtime = 'edge';

// Mock-ads API URL (개발환경에서는 로컬, 프로덕션에서는 Cloudflare Workers)
const MOCK_ADS_URL = process.env.MOCK_ADS_URL || 'http://localhost:8789';

// 광고비 데이터 타입
interface AdSpendData {
  ts: string;
  channel: string;
  campaign_id: string;
  impressions: number;
  clicks: number;
  cost: number;
}

// Mock-ads API에서 데이터 가져오기
async function fetchAdSpendData(from: string, to: string, channel?: string) {
  try {
    const params = new URLSearchParams({
      from,
      to,
      ...(channel && { channel })
    });
    
    const response = await fetch(`${MOCK_ADS_URL}/api/v1/ads/spend?${params}`);
    
    if (!response.ok) {
      throw new Error(`Mock-ads API error: ${response.status}`);
    }
    
    const data = await response.json();
    return { success: true, data: data.points || [] };
    
  } catch (error) {
    console.error('Mock-ads API 호출 실패:', error);
    // API 실패 시 fallback 데이터 생성하되 실패 상태 표시
    return { success: false, data: generateFallbackData(from, to, channel), error: error.message };
  }
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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const channel = searchParams.get('channel') ?? undefined;
    
    console.log('Ads API 호출:', { from, to, channel });
    
    // Mock-ads API에서 데이터 가져오기
    const result = await fetchAdSpendData(from, to, channel);
    
    console.log('가져온 광고비 데이터 개수:', result.data.length);
    console.log('Mock-ads API 성공 여부:', result.success);
    
    // 실패 상태를 헤더에 포함
    const response = NextResponse.json(result.data);
    response.headers.set('X-API-Status', result.success ? 'success' : 'fallback');
    if (!result.success) {
      response.headers.set('X-API-Error', result.error || 'Unknown error');
    }
    
    return response;
    
  } catch (error) {
    console.error('Ads API 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
