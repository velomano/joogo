import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const sb = supaAdmin;
    
    // 실제 데이터베이스에서 채널 목록 조회
    const { data, error } = await sb
      .from('analytics.fact_sales')
      .select('channel')
      .not('channel', 'is', null)
      .order('channel');
    
    if (error) {
      console.error('Channels fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
    }
    
    // 중복 제거하고 정렬
    const uniqueChannels = [...new Set(data?.map(row => row.channel) || [])].sort();
    
    return NextResponse.json(uniqueChannels);
  } catch (error) {
    console.error('Channels API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

