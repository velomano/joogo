import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  try {
    // 기상청 API 키 확인
    const apiKey = process.env.KMA_SERVICE_KEY;
    const baseUrl = process.env.KMA_BASE_URL;
    
    console.log('Weather API Key exists:', !!apiKey);
    console.log('Weather API Key length:', apiKey?.length || 0);
    console.log('Weather Base URL:', baseUrl);
    
    // 간단한 Mock 데이터 반환
    const mockData = {
      date: '2025-01-20',
      tavg: 15.5,
      source: 'test_mock',
      apiKeyExists: !!apiKey,
      baseUrl: baseUrl
    };
    
    return NextResponse.json(mockData);
  } catch (error) {
    console.error('Test weather API error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
