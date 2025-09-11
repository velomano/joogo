import { NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    const sb = supaAdmin();
    
    // 실제 데이터베이스에서 지역 목록 조회
    const { data, error } = await sb
      .from('analytics.fact_sales')
      .select('region')
      .not('region', 'is', null)
      .order('region');
    
    if (error) {
      console.error('Regions fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch regions' }, { status: 500 });
    }
    
    // 중복 제거하고 정렬
    const uniqueRegions = [...new Set(data?.map(row => row.region) || [])].sort();
    
    return NextResponse.json(uniqueRegions);
  } catch (error) {
    console.error('Regions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

