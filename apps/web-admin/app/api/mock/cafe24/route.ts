import { NextResponse } from 'next/server';

export const runtime = 'edge';

function seedRand(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const kind = searchParams.get('kind') ?? 'calendar';
    
    // 필터 파라미터들
    const region = searchParams.get('region')?.split(',') || [];
    const channel = searchParams.get('channel')?.split(',') || [];
    const category = searchParams.get('category')?.split(',') || [];
    const sku = searchParams.get('sku')?.split(',') || [];
    
    console.log('Mock API 필터:', { from, to, kind, region, channel, category, sku });
    
    const start = new Date(from);
    const end = new Date(to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;
    const rng = seedRand(42);

    if (kind === 'calendar') {
      const arr = Array.from({ length: days }).map((_, i) => {
        const d = new Date(+start + i * 86400000);
        const mm = d.getMonth();
        const seasonal = 1 + ((mm === 5 || mm === 10) ? 0.4 : 0) + ((mm >= 6 && mm <= 8) ? 0.2 : 0);
        const event = (d.getDate() === 1 || d.getDate() === 15) ? 1 : 0;
        
        // 필터에 따른 매출 조정
        let baseRevenue = 500000 + 4500000 * seasonal * (0.7 + rng());
        
        // 지역 필터가 있으면 해당 지역의 매출만 반영
        if (region.length > 0) {
          const regionMultiplier = region.includes('SEOUL') ? 1.5 : 
                                 region.includes('BUSAN') ? 1.2 : 0.8;
          baseRevenue *= regionMultiplier;
        }
        
        // 채널 필터가 있으면 해당 채널의 매출만 반영
        if (channel.length > 0) {
          const channelMultiplier = channel.includes('web') ? 1.2 : 
                                   channel.includes('app') ? 1.0 : 0.8;
          baseRevenue *= channelMultiplier;
        }
        
        const rev = Math.round(baseRevenue);
        const roas = +(2.0 + (rng() - 0.5) * 0.6).toFixed(2);
        
        // 온도 데이터 생성 (계절성 반영)
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const baseTemp = 15; // 연평균 15도
        const tempSeasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365); // 계절 변동
        const daily = 5 * Math.sin(dayOfYear * 0.1); // 일일 변동
        const random = (rng() - 0.5) * 8; // 랜덤 변동
        const tavg = +(baseTemp + tempSeasonal + daily + random).toFixed(1);
        
        return { date: d.toISOString().slice(0, 10), revenue: rev, roas, is_event: !!event, tavg };
      });
      return NextResponse.json(arr);
    }

    if (kind === 'channel_region') {
      const allChannels = ['web', 'app', 'mobile', 'kiosk'];
      const allRegions = [
        'SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 
        'GYEONGGI', 'GANGWON', 'CHUNGBUK', 'CHUNGNAM', 'JEONBUK', 'JEONNAM', 
        'GYEONGBUK', 'GYEONGNAM', 'JEJU'
      ];
      
      // 필터링된 채널과 지역
      const channels = channel.length > 0 ? allChannels.filter(c => channel.includes(c)) : allChannels;
      const regions = region.length > 0 ? allRegions.filter(r => region.includes(r)) : allRegions;
      
      const out: any[] = [];
      
      for (let i = 0; i < days; i++) {
        const d = new Date(+start + i * 86400000);
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = d.getDate() === 1 || d.getDate() === 15; // 매월 1일, 15일을 휴일로 설정
        
        for (const c of channels) {
          for (const r of regions) {
            // 지역별 기본 매출 패턴
            let baseRevenue = 200000;
            if (r === 'SEOUL') baseRevenue = 400000;
            else if (r === 'BUSAN') baseRevenue = 300000;
            else if (r === 'DAEGU') baseRevenue = 180000;
            else if (r === 'INCHEON') baseRevenue = 250000;
            else if (r === 'GWANGJU') baseRevenue = 150000;
            else if (r === 'DAEJEON') baseRevenue = 160000;
            else if (r === 'ULSAN') baseRevenue = 140000;
            else if (r === 'GYEONGGI') baseRevenue = 350000;
            else if (r === 'GANGWON') baseRevenue = 120000;
            else if (r === 'CHUNGBUK') baseRevenue = 100000;
            else if (r === 'CHUNGNAM') baseRevenue = 110000;
            else if (r === 'JEONBUK') baseRevenue = 130000;
            else if (r === 'JEONNAM') baseRevenue = 140000;
            else if (r === 'GYEONGBUK') baseRevenue = 160000;
            else if (r === 'GYEONGNAM') baseRevenue = 170000;
            else if (r === 'JEJU') baseRevenue = 200000;
            
            // 채널별 가중치
            let channelMultiplier = 1.0;
            if (c === 'web') channelMultiplier = 1.2;
            else if (c === 'app') channelMultiplier = 1.0;
            else if (c === 'mobile') channelMultiplier = 0.8;
            else if (c === 'kiosk') channelMultiplier = 0.6;
            
            // 주말/휴일 보정
            if (isWeekend) baseRevenue *= 1.3;
            if (isHoliday) baseRevenue *= 1.5;
            
            // 계절성 패턴 (여름/겨울 더 높음)
            const month = d.getMonth();
            if (month >= 5 && month <= 8) baseRevenue *= 1.2; // 여름
            if (month === 11 || month === 0) baseRevenue *= 1.4; // 겨울
            
            const rev = Math.round(baseRevenue * channelMultiplier * (0.8 + rng() * 0.4));
            const roas = +(1.2 + (rng() - 0.5) * 1.0).toFixed(2);
            
            out.push({ 
              date: d.toISOString().slice(0, 10), 
              channel: c, 
              region: r, 
              revenue: rev, 
              roas 
            });
          }
        }
      }
      return NextResponse.json(out);
    }

    if (kind === 'treemap' || kind === 'treemap_pareto') {
      const cats = ['TOPS', 'BOTTOMS', 'OUTER', 'ACC'];
      const out: any[] = [];
      
      // 카테고리 필터링
      const filteredCats = category.length > 0 ? cats.filter(cat => category.includes(cat)) : cats;
      
      for (const cat of filteredCats) {
        for (let i = 0; i < 10; i++) {
          const skuCode = `${cat}-${String(i + 1).padStart(3, '0')}`;
          
          // SKU 필터링
          if (sku.length > 0 && !sku.includes(skuCode)) continue;
          
          // 날짜 범위에 따른 매출 조정
          const dateRange = Math.ceil((+end - +start) / 86400000) + 1;
          const baseRevenue = 3_000_000 * (dateRange / 365); // 연간 기준으로 조정
          
          const rev = Math.round(baseRevenue * (0.4 + rng() * (cat === 'TOPS' ? 1.4 : 1)));
          const roas = +(1.5 + rng()).toFixed(2);
          out.push({ category: cat, sku: skuCode, revenue: rev, roas });
        }
      }
      return NextResponse.json(out);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
