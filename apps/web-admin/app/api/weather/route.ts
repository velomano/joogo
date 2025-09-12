import { NextResponse } from 'next/server';

export const runtime = 'edge';

type Daily = { date: string; tavg: number; humidity?: number; source: string };

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

    // 항상 Mock 데이터 사용 (Edge Runtime에서 안정적)
    console.log('Using mock data for weather');
    const mockData: Daily[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(+start + i * 86400000);
      const dateStr = d.toISOString().slice(0, 10);
      mockData.push(generateMockTemperature(dateStr));
    }
    console.log('Generated mock data length:', mockData.length);
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}