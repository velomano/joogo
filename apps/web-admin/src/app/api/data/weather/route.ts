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
    const region = searchParams.get('region') ?? 'SEOUL';
    
    console.log(`🌤️ Fetching weather data: ${region} from ${from} to ${to}`);
    
    const { data, error } = await supabase
      .from('weather_data')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .eq('region', region)
      .order('date', { ascending: true });
    
    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
    }
    
    console.log(`✅ Returned ${data.length} weather records`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
