import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-01-07';
    const region = searchParams.get('region') ?? 'SEOUL';
    
    console.log('Weather DB API 호출:', { from, to, region });
    
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error('Missing Supabase URL or Anon Key');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // DB에서 날씨 데이터 조회
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .eq('region', region)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Weather DB 조회 오류:', error);
      throw error;
    }
    
    console.log(`가져온 날씨 데이터 개수: ${data?.length || 0}`);
    
    // 응답 헤더에 상태 정보 추가
    const response = NextResponse.json(data || []);
    response.headers.set('X-API-Status', 'success');
    response.headers.set('X-Data-Source', 'database');
    
    return response;
    
  } catch (error) {
    console.error('Weather DB API 오류:', error);
    
    // DB 오류 시 Mock 데이터로 fallback - 기온과 판매량 상관관계 반영
    const start = new Date(from);
    const end = new Date(to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;
    
    const mockData = [];
    
    // 시드 기반 랜덤 생성기
    function seedRand(seed: number) {
      let s = seed;
      return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
    }
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(+start + i * 86400000);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // 계절성 반영한 온도 생성
      const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
      const baseTemp = 15; // 연평균 15도
      const tempSeasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365); // 계절 변동
      const daily = 5 * Math.sin(dayOfYear * 0.1); // 일일 변동
      const rng = seedRand(i * 1000);
      const random = (rng() - 0.5) * 8; // 랜덤 변동
      const temperature = +(baseTemp + tempSeasonal + daily + random).toFixed(1);
      
      // 온도에 따른 날씨 설명
      let description = '맑음';
      if (temperature < 0) description = '눈';
      else if (temperature < 5) description = '흐림';
      else if (temperature < 15) description = '구름많음';
      else if (temperature < 25) description = '맑음';
      else if (temperature < 30) description = '맑음';
      else description = '더움';
      
      // 강수량 (온도와 반비례)
      const precipitation = temperature > 25 ? 0 : Math.max(0, (20 - temperature) * rng() * 0.5);
      
      mockData.push({
        date: dateStr,
        region: region,
        temperature,
        humidity: Math.round(60 + (temperature - 15) * 2 + rng() * 20), // 온도와 비례
        precipitation: +precipitation.toFixed(1),
        description
      });
    }
    
    const response = NextResponse.json(mockData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'mock');
    
    return response;
  }
}
