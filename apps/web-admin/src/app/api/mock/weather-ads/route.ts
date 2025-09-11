import { NextResponse } from 'next/server';

function seedRand(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const kind = searchParams.get('kind') ?? 'funnel';
    
    const start = new Date(from);
    const end = new Date(to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;
    const rng = seedRand(42);

    if (kind === 'funnel') {
      const marketing = [
        { stage: 'impr', value: 100000, group: 'marketing' as const },
        { stage: 'clicks', value: 9000, group: 'marketing' as const },
        { stage: 'orders', value: 450, group: 'marketing' as const }
      ];
      const merchant = [
        { stage: 'impr', value: 60000, group: 'merchant' as const },
        { stage: 'clicks', value: 5400, group: 'merchant' as const },
        { stage: 'orders', value: 360, group: 'merchant' as const }
      ];
      return NextResponse.json([...marketing, ...merchant]);
    }

    if (kind === 'weather') {
      const regions = [
        'SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 
        'GYEONGGI', 'GANGWON', 'CHUNGBUK', 'CHUNGNAM', 'JEONBUK', 'JEONNAM', 
        'GYEONGBUK', 'GYEONGNAM', 'JEJU'
      ];
      
      const out: any[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(+start + i * 86400000);
        const month = d.getMonth();
        
        for (const region of regions) {
          // 지역별 기온 패턴
          let baseTemp = 15;
          if (region === 'JEJU') baseTemp = 18;
          else if (region === 'BUSAN') baseTemp = 16;
          else if (region === 'GANGWON') baseTemp = 12;
          else if (region === 'GYEONGBUK') baseTemp = 13;
          else if (region === 'GYEONGNAM') baseTemp = 14;
          
          // 계절성 패턴
          if (month >= 5 && month <= 8) baseTemp += 15; // 여름
          else if (month >= 11 || month <= 2) baseTemp -= 10; // 겨울
          else if (month >= 3 && month <= 4) baseTemp += 5; // 봄
          else if (month >= 9 && month <= 10) baseTemp += 8; // 가을
          
          const tavg = baseTemp + (rng() - 0.5) * 10;
          const tmax = tavg + 5 + rng() * 5;
          const tmin = tavg - 5 - rng() * 5;
          const precipitation = rng() > 0.7 ? Math.round(rng() * 20) : 0;
          
          out.push({
            date: d.toISOString().slice(0, 10),
            region,
            tavg: Math.round(tavg * 10) / 10,
            tmax: Math.round(tmax * 10) / 10,
            tmin: Math.round(tmin * 10) / 10,
            precipitation: Math.round(precipitation)
          });
        }
      }
      return NextResponse.json(out);
    }

    if (kind === 'ads') {
      const platforms = ['google', 'meta', 'naver', 'kakao', 'tiktok'];
      const campaigns = ['AlwaysOn', 'PromoPush', 'Seasonal', 'BrandAwareness', 'Conversion'];
      
      const out: any[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(+start + i * 86400000);
        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
        
        for (const platform of platforms) {
          for (const campaign of campaigns) {
            let baseSpend = 50000;
            if (platform === 'google') baseSpend = 80000;
            else if (platform === 'meta') baseSpend = 60000;
            else if (platform === 'naver') baseSpend = 40000;
            else if (platform === 'kakao') baseSpend = 30000;
            else if (platform === 'tiktok') baseSpend = 20000;
            
            if (isWeekend) baseSpend *= 1.2;
            if (campaign === 'PromoPush') baseSpend *= 1.5;
            
            const spend = Math.round(baseSpend * (0.8 + rng() * 0.4));
            const impressions = Math.round(spend * (80 + rng() * 40));
            const clicks = Math.round(impressions * (0.05 + rng() * 0.03));
            
            out.push({
              date: d.toISOString().slice(0, 10),
              platform,
              campaign,
              spend,
              impressions,
              clicks,
              ctr: Math.round((clicks / impressions) * 10000) / 100
            });
          }
        }
      }
      return NextResponse.json(out);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Weather-ads Mock API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}