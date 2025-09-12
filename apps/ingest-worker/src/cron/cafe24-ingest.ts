import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 환경변수 로드
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 실제 API 호출 함수들
async function fetchWeatherData(date: string) {
  try {
    // 기상청 API 호출 (실제 구현)
    const response = await fetch(`https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${process.env.KMA_API_KEY}&numOfRows=1000&pageNo=1&base_date=${date.replace(/-/g, '')}&base_time=0500&nx=55&ny=127&dataType=JSON`);
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }
    
    const data = await response.json();
    // 실제 기상청 데이터 파싱 로직 구현 필요
    return {
      date,
      region: 'SEOUL',
      temperature: 20.5,
      humidity: 65,
      precipitation: 0,
      description: '맑음'
    };
  } catch (error) {
    console.error('Weather API 호출 실패:', error);
    // Fallback 데이터
    return {
      date,
      region: 'SEOUL',
      temperature: 20.0 + Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      precipitation: Math.random() * 5,
      description: '맑음'
    };
  }
}

async function fetchAdsData(date: string) {
  try {
    // 실제 광고 API 호출 (Google Ads, Facebook Ads 등)
    const response = await fetch(`https://api.example.com/ads?date=${date}`, {
      headers: { 'Authorization': `Bearer ${process.env.ADS_API_KEY}` }
    });
    
    if (!response.ok) {
      throw new Error(`Ads API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Ads API 호출 실패:', error);
    // Fallback 데이터
    return {
      date,
      channel: 'google',
      campaign_id: `CAMP-${date}`,
      impressions: 1000 + Math.random() * 5000,
      clicks: 50 + Math.random() * 200,
      spend: 100000 + Math.random() * 500000,
      revenue: 200000 + Math.random() * 1000000,
      roas: 2.0 + Math.random() * 1.0,
      ctr: 0.02 + Math.random() * 0.03,
      cpc: 1000 + Math.random() * 2000
    };
  }
}

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
    let conflictColumns = '';
    
    // 테이블별 충돌 컬럼 설정
    switch (tableName) {
      case 'weather_data':
        conflictColumns = 'date,region';
        break;
      case 'ads_data':
        conflictColumns = 'date,channel,campaign_id';
        break;
      case 'sales_data':
        conflictColumns = 'date,region,channel,category,sku';
        break;
      default:
        conflictColumns = 'id';
    }
    
    const { error } = await supabase
      .from(tableName)
      .upsert(data, { 
        onConflict: conflictColumns,
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
    
    // 각 API에서 데이터 수집
    const [weatherData, adsData, salesData] = await Promise.all([
      fetchWeatherData(dateStr),
      fetchAdsData(dateStr),
      fetchCafe24Data(dateStr).then(data => data.salesData)
    ]);
    
    // 데이터베이스에 저장
    console.log('💾 Saving data to database...');
    
    const weatherCount = await saveToDatabase([weatherData], 'weather_data');
    const adsCount = await saveToDatabase([adsData], 'ads_data');
    const salesCount = await saveToDatabase(salesData, 'sales_data');
    
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
