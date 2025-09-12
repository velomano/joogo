import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 환경변수 로드
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Cafe24 API 시뮬레이션 (실제로는 Cafe24 API 호출)
async function fetchCafe24Data(date: string) {
  // 실제 구현에서는 Cafe24 API 호출
  // const response = await fetch(`https://api.cafe24.com/sales?date=${date}`, {
  //   headers: { 'Authorization': `Bearer ${process.env.CAFE24_API_KEY}` }
  // });
  
  // 현재는 Mock 데이터 생성
  const rng = (seed: number) => {
    let s = seed;
    return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  };
  
  const random = rng(parseInt(date.replace(/-/g, '')));
  const regions = ['SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 'GYEONGGI'];
  const channels = ['web', 'app', 'mobile', 'kiosk'];
  const categories = ['TOPS', 'BOTTOMS', 'OUTER', 'ACC', 'SHOES', 'BAGS'];
  
  const salesData: { date: string; region: string; channel: string; category: string; sku: string; revenue: number; quantity: number; roas: number; spend: number; is_event: boolean }[] = [];
  const weatherData: { date: string; region: string; tavg: number; tmin: number; tmax: number; humidity: number; precipitation: number }[] = [];
  const adsData: { date: string; channel: string; campaign: string; impressions: number; clicks: number; spend: number; revenue: number; roas: number; ctr: number; cpc: number }[] = [];
  
  // 매출 데이터 생성
  for (const region of regions) {
    for (const channel of channels) {
      for (const category of categories) {
        const seasonal = 1 + (new Date(date).getMonth() === 5 || new Date(date).getMonth() === 10 ? 0.4 : 0);
        const event = new Date(date).getDate() === 1 || new Date(date).getDate() === 15 ? 1 : 0;
        const revenue = Math.round(500000 + 4500000 * seasonal * (0.7 + random()));
        const quantity = Math.round(revenue / 50000);
        const roas = +(2.0 + (random() - 0.5) * 0.6).toFixed(2);
        const spend = Math.round(revenue / roas);
        
        salesData.push({
          date,
          region,
          channel,
          category,
          sku: `${category}-${String(Math.floor(random() * 100)).padStart(3, '0')}`,
          revenue,
          quantity,
          roas,
          spend,
          is_event: !!event
        });
      }
    }
  }
  
  // 날씨 데이터 생성
  for (const region of regions) {
    const dayOfYear = Math.floor((new Date(date).getTime() - new Date(new Date(date).getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const baseTemp = 15;
    const tempSeasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
    const daily = 5 * Math.sin(dayOfYear * 0.1);
    const randomTemp = (random() - 0.5) * 8;
    const tavg = +(baseTemp + tempSeasonal + daily + randomTemp).toFixed(1);
    
    weatherData.push({
      date,
      region,
      tavg,
      tmin: +(tavg - 5).toFixed(1),
      tmax: +(tavg + 5).toFixed(1),
      humidity: Math.round(60 + random() * 30),
      precipitation: +(random() * 20).toFixed(2)
    });
  }
  
  // 광고 데이터 생성
  for (const channel of channels) {
    const campaigns = ['AlwaysOn', 'PromoPush', 'Seasonal', 'Brand'];
    for (const campaign of campaigns) {
      const impressions = Math.round(10000 + random() * 50000);
      const clicks = Math.round(impressions * (0.01 + random() * 0.02));
      const spend = Math.round(10000 + random() * 100000);
      const revenue = Math.round(spend * (1.5 + random() * 1.0));
      const roas = +(revenue / spend).toFixed(2);
      
      adsData.push({
        date,
        channel,
        campaign,
        impressions,
        clicks,
        spend,
        revenue,
        roas,
        ctr: +(clicks / impressions * 100).toFixed(2),
        cpc: +(spend / clicks).toFixed(2)
      });
    }
  }
  
  return { salesData, weatherData, adsData };
}

// 데이터베이스에 데이터 저장
async function saveToDatabase(data: any, tableName: string) {
  try {
    const { error } = await supabase
      .from(tableName)
      .upsert(data, { 
        onConflict: 'date,region,channel,category,sku',
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error(`Error saving to ${tableName}:`, error);
      throw error;
    }
    
    console.log(`✅ Saved ${data.length} records to ${tableName}`);
    return data.length;
  } catch (error) {
    console.error(`Failed to save to ${tableName}:`, error);
    throw error;
  }
}

// 크론 작업 로그 저장
async function logCronJob(jobName: string, status: string, startedAt: Date, completedAt?: Date, recordsProcessed = 0, errorMessage?: string) {
  try {
    const { error } = await supabase
      .from('cron_job_logs')
      .insert({
        job_name: jobName,
        status,
        started_at: startedAt.toISOString(),
        completed_at: completedAt?.toISOString(),
        records_processed: recordsProcessed,
        error_message: errorMessage
      });
    
    if (error) {
      console.error('Error logging cron job:', error);
    }
  } catch (error) {
    console.error('Failed to log cron job:', error);
  }
}

// 메인 크론 작업 함수
export async function runCafe24Ingest() {
  const jobName = 'cafe24-ingest';
  const startedAt = new Date();
  let totalRecords = 0;
  
  try {
    console.log(`🚀 Starting ${jobName} at ${startedAt.toISOString()}`);
    
    // 어제 데이터 수집 (실제 운영에서는 실시간 데이터)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];
    
    console.log(`📊 Fetching data for ${dateStr}`);
    const { salesData, weatherData, adsData } = await fetchCafe24Data(dateStr);
    
    // 데이터베이스에 저장
    console.log('💾 Saving data to database...');
    
    const salesCount = await saveToDatabase(salesData, 'sales_data');
    const weatherCount = await saveToDatabase(weatherData, 'weather_data');
    const adsCount = await saveToDatabase(adsData, 'ads_data');
    
    totalRecords = salesCount + weatherCount + adsCount;
    
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    
    console.log(`✅ ${jobName} completed successfully!`);
    console.log(`📈 Processed ${totalRecords} records in ${duration}ms`);
    console.log(`   - Sales: ${salesCount} records`);
    console.log(`   - Weather: ${weatherCount} records`);
    console.log(`   - Ads: ${adsCount} records`);
    
    // 성공 로그 저장
    await logCronJob(jobName, 'success', startedAt, completedAt, totalRecords);
    
  } catch (error) {
    const completedAt = new Date();
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`❌ ${jobName} failed:`, errorMessage);
    
    // 실패 로그 저장
    await logCronJob(jobName, 'failed', startedAt, completedAt, totalRecords, errorMessage);
    
    throw error;
  }
}

// 스크립트로 직접 실행할 때
if (require.main === module) {
  runCafe24Ingest()
    .then(() => {
      console.log('Cron job completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Cron job failed:', error);
      process.exit(1);
    });
}
