import { NextResponse } from 'next/server';

export const runtime = 'edge';

type Daily = { date: string; tavg: number; humidity?: number; source: string };

// 기상청 공공데이터포털 API 설정
const WEATHER_API_KEY = process.env.KMA_SERVICE_KEY || process.env.WEATHER_API_KEY || 'your_api_key_here';
const WEATHER_BASE_URL = process.env.KMA_BASE_URL || 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst';

// 지역별 좌표 (기상청 격자 좌표)
const REGION_COORDINATES = {
  'SEOUL': { nx: 60, ny: 127 },
  'BUSAN': { nx: 98, ny: 76 },
  'DAEGU': { nx: 89, ny: 90 },
  'INCHEON': { nx: 55, ny: 124 },
  'GWANGJU': { nx: 58, ny: 74 },
  'DAEJEON': { nx: 67, ny: 100 },
  'ULSAN': { nx: 102, ny: 84 },
  'GYEONGGI': { nx: 60, ny: 120 },
  'GANGWON': { nx: 73, ny: 134 },
  'CHUNGBUK': { nx: 69, ny: 107 },
  'CHUNGNAM': { nx: 68, ny: 100 },
  'JEONBUK': { nx: 63, ny: 89 },
  'JEONNAM': { nx: 51, ny: 67 },
  'GYEONGBUK': { nx: 89, ny: 91 },
  'GYEONGNAM': { nx: 91, ny: 77 },
  'JEJU': { nx: 52, ny: 38 }
};

// 현재 시간 기준으로 base_date와 base_time 계산
function getBaseDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  // 기상청 API는 02, 05, 08, 11, 14, 17, 20, 23시에 발표
  const hour = now.getHours();
  let baseTime = '0200';
  if (hour >= 2 && hour < 5) baseTime = '0200';
  else if (hour >= 5 && hour < 8) baseTime = '0500';
  else if (hour >= 8 && hour < 11) baseTime = '0800';
  else if (hour >= 11 && hour < 14) baseTime = '1100';
  else if (hour >= 14 && hour < 17) baseTime = '1400';
  else if (hour >= 17 && hour < 20) baseTime = '1700';
  else if (hour >= 20 && hour < 23) baseTime = '2000';
  else baseTime = '2300';
  
  return {
    base_date: `${year}${month}${day}`,
    base_time: baseTime
  };
}

// 기상청 API에서 온도 데이터 가져오기
async function fetchWeatherData(region: string, date: string) {
  try {
    const coords = REGION_COORDINATES[region as keyof typeof REGION_COORDINATES];
    if (!coords) {
      throw new Error(`Unknown region: ${region}`);
    }

    const { base_date, base_time } = getBaseDateTime();
    
    const params = new URLSearchParams({
      serviceKey: WEATHER_API_KEY,
      pageNo: '1',
      numOfRows: '1000',
      dataType: 'JSON',
      base_date,
      base_time,
      nx: coords.nx.toString(),
      ny: coords.ny.toString()
    });

    const response = await fetch(`${WEATHER_BASE_URL}?${params}`);
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.response?.header?.resultCode !== '00') {
      throw new Error(`Weather API error: ${data.response?.header?.resultMsg}`);
    }

    // TMP (1시간 기온) 데이터 추출
    const tempData = data.response?.body?.items?.item?.filter((item: any) => 
      item.category === 'TMP' && item.fcstDate === date
    ) || [];

    if (tempData.length === 0) {
      // 데이터가 없으면 Mock 데이터 반환
      return generateMockTemperature(date);
    }

    // 해당 날짜의 평균 온도 계산
    const temperatures = tempData.map((item: any) => parseFloat(item.fcstValue));
    const avgTemp = temperatures.reduce((sum: number, temp: number) => sum + temp, 0) / temperatures.length;
    
    // 습도 데이터도 가져오기 (REH - 습도)
    const humidityData = data.response?.body?.items?.item?.filter((item: any) => 
      item.category === 'REH' && item.fcstDate === date
    ) || [];
    
    let avgHumidity = 50; // 기본값
    if (humidityData.length > 0) {
      const humidities = humidityData.map((item: any) => parseFloat(item.fcstValue));
      avgHumidity = humidities.reduce((sum: number, hum: number) => sum + hum, 0) / humidities.length;
    }
    
    return {
      date,
      tavg: Math.round(avgTemp * 10) / 10, // 소수점 1자리
      humidity: Math.round(avgHumidity) / 100, // 0-1 범위로 정규화
      source: 'weather_api'
    };
  } catch (error) {
    console.error(`Weather API error for ${region} on ${date}:`, error);
    // API 오류 시 Mock 데이터 반환
    return generateMockTemperature(date);
  }
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
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') || '2025-01-01';
    const to = searchParams.get('to') || '2025-12-31';
    const region = searchParams.get('region') || 'SEOUL';

    console.log('Weather API params:', { from, to, region });

    const start = new Date(from);
    const end = new Date(to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;

    console.log('Weather API calculated days:', days);

    // 날짜 범위가 너무 크면 Mock 데이터 사용 (API 제한 고려)
    if (days > 3) {
      console.log('Using mock data for large date range');
      type Daily = { date: string; tavg: number; humidity?: number; source: string };
      const mockData: Daily[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(+start + i * 86400000);
        const dateStr = d.toISOString().slice(0, 10);
        mockData.push(generateMockTemperature(dateStr));
      }
      console.log('Generated mock data length:', mockData.length);
      return NextResponse.json(mockData);
    }

    // 실제 기상청 API 호출
    const weatherData: any[] = [];
    console.log(`Fetching weather data for ${region} from ${from} to ${to} (${days} days)`);
    
    for (let i = 0; i < days; i++) {
      const d = new Date(+start + i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      
      // 과거 날짜는 Mock 데이터 사용 (API는 현재+미래만 지원)
      if (d < new Date()) {
        const mockData = generateMockTemperature(dateStr);
        weatherData.push(mockData);
        console.log(`Mock data for ${dateStr}: ${mockData.tavg}°C`);
      } else {
        const tempData = await fetchWeatherData(region, dateStr);
        weatherData.push(tempData);
        console.log(`Weather API data for ${dateStr}: ${tempData.tavg}°C (${tempData.source})`);
      }
    }

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
