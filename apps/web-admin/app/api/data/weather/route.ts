import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 지역 코드 매핑
const REGION_CODES: { [key: string]: string } = {
  'SEOUL': '1100000000',
  'BUSAN': '2600000000', 
  'DAEGU': '2700000000',
  'INCHEON': '2800000000',
  'GWANGJU': '2900000000',
  'DAEJEON': '3000000000',
  'ULSAN': '3100000000',
  'GYEONGGI': '4100000000',
  'GANGWON': '4200000000',
  'CHUNGBUK': '4300000000',
  'CHUNGNAM': '4400000000',
  'JEONBUK': '4500000000',
  'JEONNAM': '4600000000',
  'GYEONGBUK': '4700000000',
  'GYEONGNAM': '4800000000',
  'JEJU': '5000000000'
};

// 기상청 API 호출 함수
async function fetchWeatherData(region: string, from: string, to: string) {
  const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
  const regionCode = REGION_CODES[region.toUpperCase()] || REGION_CODES['SEOUL'];
  
  // 현재 시간 기준으로 기상청 API 호출
  const now = new Date();
  const baseDate = now.toISOString().slice(0, 10).replace(/-/g, '');
  const baseTime = '0500'; // 5시 기준 (기상청 API 권장)
  
  const apiUrl = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${WEATHER_API_KEY}&numOfRows=1000&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=60&ny=127&dataType=JSON`;
  
  console.log('기상청 API 호출:', apiUrl);
  
  const response = await fetch(apiUrl);
  const data = await response.json();
  
  if (data.response?.header?.resultCode !== '00') {
    throw new Error(`기상청 API 오류: ${data.response?.header?.resultMsg || 'Unknown error'}`);
  }
  
  const items = data.response?.body?.items?.item || [];
  console.log(`기상청 API 응답 아이템 수: ${items.length}`);
  
  // 기상청 데이터를 우리 형식으로 변환
  type WeatherRow = {
    date: string;
    region: string;
    temperature: number;
    humidity: number;
    precipitation: number;
    description: string;
  };
  
  const weatherData: WeatherRow[] = [];
  const processedDates = new Set();
  
  for (const item of items) {
    const date = item.fcstDate;
    const time = item.fcstTime;
    
    if (processedDates.has(date)) continue;
    
    // 온도 데이터 찾기
    const tempItem = items.find(i => i.fcstDate === date && i.fcstTime === time && i.category === 'TMP');
    // 습도 데이터 찾기  
    const humidityItem = items.find(i => i.fcstDate === date && i.fcstTime === time && i.category === 'REH');
    // 강수량 데이터 찾기
    const rainItem = items.find(i => i.fcstDate === date && i.fcstTime === time && i.category === 'PCP');
    // 날씨 상태 데이터 찾기
    const skyItem = items.find(i => i.fcstDate === date && i.fcstTime === time && i.category === 'SKY');
    
    if (tempItem) {
      const temperature = parseFloat(tempItem.fcstValue);
      const humidity = humidityItem ? parseInt(humidityItem.fcstValue) : 60;
      const precipitation = rainItem ? parseFloat(rainItem.fcstValue) : 0;
      
      // SKY 코드를 날씨 설명으로 변환
      let description = '맑음';
      if (skyItem) {
        const skyCode = skyItem.fcstValue;
        if (skyCode === '1') description = '맑음';
        else if (skyCode === '3') description = '구름많음';
        else if (skyCode === '4') description = '흐림';
      }
      
      weatherData.push({
        date: `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`,
        region: region,
        temperature: temperature,
        humidity: humidity,
        precipitation: precipitation,
        description: description
      });
      
      processedDates.add(date);
    }
  }
  
  return weatherData;
}

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
    
    // DB에서 실제 기상청 데이터 조회
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
    
    console.log(`DB에서 가져온 실제 날씨 데이터 개수: ${data?.length || 0}`);
    
    // 응답 헤더에 상태 정보 추가
    const response = NextResponse.json(data || []);
    response.headers.set('X-API-Status', 'success');
    response.headers.set('X-Data-Source', 'database');
    
    return response;
    
  } catch (error) {
    console.error('Weather API 오류:', error);
    return NextResponse.json([]);
  }
}
