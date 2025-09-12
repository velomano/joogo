import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') ?? '2025-01-01';
    const to = searchParams.get('to') ?? '2025-12-31';
    const kind = searchParams.get('kind') ?? 'calendar';
    
    console.log(`📊 Fetching sales data: ${kind} from ${from} to ${to}`);
    
    if (kind === 'calendar') {
      // 캘린더 히트맵 데이터
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }
      
      // 날짜별로 그룹화하여 집계
      const groupedData = data.reduce((acc: any, item: any) => {
        const date = item.date;
        if (!acc[date]) {
          acc[date] = {
            date,
            revenue: 0,
            quantity: 0,
            roas: 0,
            spend: 0,
            is_event: item.is_event,
            tavg: 0 // 날씨 데이터는 별도 조회 필요
          };
        }
        acc[date].revenue += item.revenue;
        acc[date].quantity += item.quantity;
        acc[date].spend += item.spend || 0;
        acc[date].roas = acc[date].spend > 0 ? acc[date].revenue / acc[date].spend : 0;
      }, {});
      
      const result = Object.values(groupedData);
      console.log(`✅ Returned ${result.length} calendar records`);
      return NextResponse.json(result);
    }
    
    if (kind === 'channel_region') {
      // 채널별 지역별 데이터
      const { data, error } = await supabase
        .from('sales_data')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true });
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }
      
      console.log(`✅ Returned ${data.length} channel_region records`);
      return NextResponse.json(data);
    }
    
    if (kind === 'treemap_pareto') {
      // 파레토 분석 데이터 (카테고리별 집계)
      const { data, error } = await supabase
        .from('sales_data')
        .select('category, revenue, quantity')
        .gte('date', from)
        .lte('date', to);
      
      if (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: 'Database query failed' }, { status: 500 });
      }
      
      // 카테고리별 집계
      const categoryData = data.reduce((acc: any, item: any) => {
        const category = item.category;
        if (!acc[category]) {
          acc[category] = {
            category,
            revenue: 0,
            quantity: 0
          };
        }
        acc[category].revenue += item.revenue;
        acc[category].quantity += item.quantity;
        return acc;
      }, {});
      
      const result = Object.values(categoryData).sort((a: any, b: any) => b.revenue - a.revenue);
      console.log(`✅ Returned ${result.length} treemap_pareto records`);
      return NextResponse.json(result);
    }
    
    return NextResponse.json({ error: 'Invalid kind parameter' }, { status: 400 });
    
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
