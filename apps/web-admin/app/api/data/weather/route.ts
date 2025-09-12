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
    
    // DB 오류 시 Mock 데이터로 fallback
    const mockData = [
      {
        date: '2025-01-01',
        region: 'SEOUL',
        temperature: 15.5,
        humidity: 65,
        precipitation: 0,
        description: '맑음'
      },
      {
        date: '2025-01-02',
        region: 'SEOUL',
        temperature: 18.2,
        humidity: 70,
        precipitation: 2.5,
        description: '비'
      }
    ];
    
    const response = NextResponse.json(mockData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'mock');
    
    return response;
  }
}
