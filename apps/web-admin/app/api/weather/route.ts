import { NextResponse } from 'next/server';

export const runtime = 'edge';

type Daily = { date: string; tavg: number; humidity?: number; source: string };

// 실제 기상청 API 호출 함수
async function fetchWeatherData(from: string, to: string, region: string) {
  const apiKey = process.env.KMA_API_KEY;
  if (!apiKey || apiKey === 'your_kma_api_key_here') {
    throw new Error('KMA_API_KEY 환경변수가 설정되지 않았습니다');
  }
  
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.ceil((+end - +start) / 86400000) + 1;
  
  const weatherData: Daily[] = [];
  
  // 각 날짜별로 기상청 API 호출
  for (let i = 0; i < days; i++) {
    const d = new Date(+start + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const baseDate = dateStr.replace(/-/g, '');
    
    try {
      const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&numOfRows=1000&pageNo=1&base_date=${baseDate}&base_time=0500&nx=55&ny=127&dataType=JSON`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`기상청 API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.response?.header?.resultCode !== '00') {
        throw new Error(`기상청 API 응답 오류: ${data.response?.header?.resultMsg}`);
      }
      
      // 기상청 데이터 파싱
      const items = data.response?.body?.items?.item || [];
      let tavg = 20.0; // 기본값
      let humidity = 60; // 기본값
      
      // TMP (기온), REH (습도) 데이터 추출
      for (const item of items) {
        if (item.category === 'TMP' && item.fcstTime === '0600') {
          tavg = parseFloat(item.fcstValue) || tavg;
        }
        if (item.category === 'REH' && item.fcstTime === '0600') {
          humidity = parseInt(item.fcstValue) || humidity;
        }
      }
      
      weatherData.push({
        date: dateStr,
        tavg,
        humidity: humidity / 100, // 0-1 범위로 정규화
        source: 'kma-api'
      });
      
    } catch (error) {
      console.error(`날짜 ${dateStr} 기상청 API 호출 실패:`, error);
      // 개별 날짜 실패 시 Mock 데이터 사용
      weatherData.push(generateMockTemperature(dateStr));
    }
  }
  
  return weatherData;
}

// Mock 온도 데이터 생성 (API 오류 시 fallback)
function generateMockTemperature(date: string) {
  const d = new Date(date);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // 더 현실적인 온도 분포
  const baseTemp = 15;
  const seasonal = 12 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
  const daily = 6 * Math.sin(dayOfYear * 0.1);
  const random = (Math.random() - 0.5) * 6;
  const tavg = Math.round((baseTemp + seasonal + daily + random) * 10) / 10;
  
  // 습도 계산 (온도와 반비례)
  const humidity = Math.round(80 - (tavg - 10) * 2 + (Math.random() - 0.5) * 20);
  const clampedHumidity = Math.max(30, Math.min(95, humidity));
  
  return {
    date,
    tavg,
    humidity: clampedHumidity / 100, // 0-1 범위로 정규화
    source: 'mock_fallback'
  };
}

export async function GET(req: Request) {
  try {
    console.log('Weather API called');
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || '2025-01-01';
    const to = url.searchParams.get('to') || '2025-12-31';
    const region = url.searchParams.get('region') || 'SEOUL';

    console.log('Weather API params:', { from, to, region });

    const start = new Date(from);
    const end = new Date(to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;

    console.log('Weather API calculated days:', days);

    // 실제 기상청 API 호출 시도
    try {
      console.log('🌤️  기상청 API 호출 시도');
      const weatherData = await fetchWeatherData(from, to, region);
      console.log('✅ 기상청 데이터 수신:', weatherData.length, '개');
      
      // 응답 헤더에 상태 정보 추가
      const response = NextResponse.json(weatherData);
      response.headers.set('X-API-Status', 'success');
      response.headers.set('X-Data-Source', 'kma-api');
      
      return response;
      
    } catch (apiError) {
      console.error('❌ 기상청 API 호출 실패:', apiError);
      console.log('🔄 Fallback Mock 데이터 사용');
      
      // Fallback: Mock 데이터 사용
      const mockData: Daily[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(+start + i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        mockData.push(generateMockTemperature(dateStr));
      }
      console.log('Generated mock data length:', mockData.length);
      
      // 응답 헤더에 fallback 상태 표시
      const response = NextResponse.json(mockData);
      response.headers.set('X-API-Status', 'fallback');
      response.headers.set('X-API-Error', apiError instanceof Error ? apiError.message : 'Unknown error');
      response.headers.set('X-Data-Source', 'mock');
      
      return response;
    }
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}