import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 샘플 데이터 생성 함수
function generateSampleData(from: string, to: string) {
  const start = new Date(from);
  const end = new Date(to);
  const days = Math.ceil((+end - +start) / 86400000) + 1;
  
  const channels = ['web', 'app'];
  const regions = ['SEOUL', 'BUSAN', 'INCHEON', 'DAEGU', 'GWANGJU', 'DAEJEON', 'ULSAN'];
  const categories = ['TOPS', 'BOTTOMS', 'OUTER', 'ACC'];
  
  const salesData: any[] = [];
  const weatherData: any[] = [];
  const adsData: any[] = [];
  
  for (let i = 0; i < days; i++) {
    const d = new Date(+start + i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    
    // 날씨 데이터 생성
    const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const baseTemp = 15;
    const seasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
    const daily = 5 * Math.sin(dayOfYear * 0.1);
    const random = (Math.random() - 0.5) * 8;
    const tavg = Math.round((baseTemp + seasonal + daily + random) * 10) / 10;
    
    weatherData.push({
      date: dateStr,
      region: 'SEOUL',
      tavg,
      tmin: tavg - 5,
      tmax: tavg + 5,
      humidity: Math.round(50 + Math.random() * 30),
      precipitation: Math.random() > 0.8 ? Math.round(Math.random() * 20) : 0
    });
    
    // 광고 데이터 생성
    const impressions = Math.round(100000 + Math.random() * 50000);
    const clicks = Math.round(impressions * (0.02 + Math.random() * 0.03));
    const spend = Math.round(clicks * (100 + Math.random() * 200));
    const revenue = Math.round(spend * (1.5 + Math.random() * 1.0));
    
    adsData.push({
      date: dateStr,
      platform: 'google',
      impressions,
      clicks,
      spend,
      revenue,
      roas: revenue / spend
    });
    
    // 판매 데이터 생성 (채널별, 지역별, 카테고리별)
    for (const channel of channels) {
      for (const region of regions) {
        for (const category of categories) {
          const baseRevenue = region === 'SEOUL' ? 200000 : region === 'BUSAN' ? 150000 : 100000;
          const channelMultiplier = channel === 'web' ? 1.2 : 0.8;
          const categoryMultiplier = category === 'TOPS' ? 1.5 : category === 'BOTTOMS' ? 1.2 : 1.0;
          
          const revenue = Math.round(baseRevenue * channelMultiplier * categoryMultiplier * (0.7 + Math.random() * 0.6));
          const quantity = Math.round(revenue / (50000 + Math.random() * 30000));
          const spend = Math.round(revenue * (0.3 + Math.random() * 0.2));
          const roas = revenue / spend;
          
          salesData.push({
            date: dateStr,
            channel,
            region,
            category,
            sku: `${category}-${String(Math.floor(Math.random() * 100) + 1).padStart(3, '0')}`,
            revenue,
            quantity,
            spend,
            roas,
            is_event: d.getDate() === 1 || d.getDate() === 15
          });
        }
      }
    }
  }
  
  return { salesData, weatherData, adsData };
}

export async function POST(request: NextRequest) {
  try {
    const { from = '2025-01-01', to = '2025-01-31' } = await request.json();
    
    console.log(`🌱 Generating sample data from ${from} to ${to}`);
    
    const { salesData, weatherData, adsData } = generateSampleData(from, to);
    
    // 기존 데이터 삭제
    await supabase.from('sales_data').delete().gte('date', from).lte('date', to);
    await supabase.from('weather_data').delete().gte('date', from).lte('date', to);
    await supabase.from('ads_data').delete().gte('date', from).lte('date', to);
    
    // 새 데이터 삽입
    const { error: salesError } = await supabase
      .from('sales_data')
      .insert(salesData);
    
    const { error: weatherError } = await supabase
      .from('weather_data')
      .insert(weatherData);
    
    const { error: adsError } = await supabase
      .from('ads_data')
      .insert(adsData);
    
    if (salesError || weatherError || adsError) {
      throw new Error(`Database insert error: ${salesError?.message || weatherError?.message || adsError?.message}`);
    }
    
    console.log(`✅ Generated ${salesData.length} sales, ${weatherData.length} weather, ${adsData.length} ads records`);
    
    return NextResponse.json({
      success: true,
      message: 'Sample data generated successfully',
      counts: {
        sales: salesData.length,
        weather: weatherData.length,
        ads: adsData.length
      }
    });
    
  } catch (error) {
    console.error('❌ Sample data generation failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Sample data generation failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
