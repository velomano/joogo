import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const channel = searchParams.get('channel');
    
    console.log(`📢 Fetching ads data: ${channel || 'all'} from ${from} to ${to}`);
    
    let query = supabase
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
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    console.log(`✅ Returned ${data.length} ads records`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
