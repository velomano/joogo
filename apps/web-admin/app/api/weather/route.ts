import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-01-07';
    const region = searchParams.get('region') ?? 'SEOUL';
    
    console.log('Weather API 호출 (DB에서 조회):', { from, to, region });
    
    const sb = supaAdmin();
    
    // DB에서 날씨 데이터 조회
    const { data, error } = await sb
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
    
    // DB 데이터를 API 형식으로 변환
    const weatherData = (data || []).map(item => ({
      date: item.date,
      tavg: item.temperature,
      humidity: item.humidity,
      source: 'DATABASE'
    }));
    
    // 응답 헤더에 상태 정보 추가
    const response = NextResponse.json(weatherData);
    response.headers.set('X-API-Status', 'success');
    response.headers.set('X-Data-Source', 'database');
    
    return response;
    
  } catch (error) {
    console.error('Weather API 오류:', error);
    
    // DB 오류 시 Mock 데이터로 fallback
    const mockData = [
      {
        date: '2025-01-01',
        tavg: 15.5,
        humidity: 65,
        source: 'FALLBACK'
      },
      {
        date: '2025-01-02',
        tavg: 18.2,
        humidity: 70,
        source: 'FALLBACK'
      }
    ];
    
    const response = NextResponse.json(mockData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'mock');
    
    return response;
  }
}