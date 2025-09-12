import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../../src/lib/supabase/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-01-07';
    const channel = searchParams.get('channel');
    
    console.log('Ads DB API 호출:', { from, to, channel });
    
    const sb = supaAdmin();
    
    // DB에서 광고 데이터 조회
    let query = sb
      .from('ads_data')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });
    
    if (channel) {
      query = query.eq('channel', channel);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Ads DB 조회 오류:', error);
      throw error;
    }
    
    console.log(`가져온 광고 데이터 개수: ${data?.length || 0}`);
    
    // 응답 헤더에 상태 정보 추가
    const response = NextResponse.json(data || []);
    response.headers.set('X-API-Status', 'success');
    response.headers.set('X-Data-Source', 'database');
    
    return response;
    
  } catch (error) {
    console.error('Ads DB API 오류:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
