import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// 환경변수 로드
config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 실제 기상청 API 호출 함수 (최적화된 버전)
async function fetchWeatherData(date: string) {
  // 로그 출력 최소화
  const today = new Date();
  const targetDate = new Date(date);
  const daysDiff = Math.ceil((today.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // 최근 3일 이내가 아니면 Mock 데이터 사용
  if (daysDiff > 3) {
    return generateMockWeatherData(date);
  }
  
  console.log(`🌤️  기상청 API 호출: ${date}`);
  
  try {
    // 기상청 단기예보 API 호출
    const baseDate = date.replace(/-/g, '');
    const baseTime = '0500'; // 5시 기준
    const nx = '55'; // 서울시 강남구 좌표
    const ny = '127';
    
    const apiKey = process.env.KMA_SERVICE_KEY;
    if (!apiKey) {
      throw new Error('KMA_SERVICE_KEY 환경변수가 설정되지 않았습니다');
    }
    
    const url = `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${apiKey}&numOfRows=1000&pageNo=1&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;
    
    console.log(`API URL: ${url.substring(0, 100)}...`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`기상청 API 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.response?.header?.resultCode !== '00') {
      throw new Error(`기상청 API 응답 오류: ${data.response?.header?.resultMsg}`);
    }
    
    // 기상청 데이터 파싱
    const items = data.response?.body?.items?.item || [];
    let tavg = 20.0; // 기본값
    let humidity = 60; // 기본값
    let precipitation = 0; // 기본값
    
    // TMP (기온), REH (습도), PCP (강수량) 데이터 추출
    for (const item of items) {
      if (item.category === 'TMP' && item.fcstTime === '0600') {
        tavg = parseFloat(item.fcstValue) || tavg;
      }
      if (item.category === 'REH' && item.fcstTime === '0600') {
        humidity = parseInt(item.fcstValue) || humidity;
      }
      if (item.category === 'PCP' && item.fcstTime === '0600') {
        precipitation = parseFloat(item.fcstValue) || precipitation;
      }
    }
    
    console.log(`✅ 기상청 데이터 수신: 기온 ${tavg}°C, 습도 ${humidity}%, 강수량 ${precipitation}mm`);
    
    return {
      date,
      region: 'SEOUL',
      temperature: tavg,
      humidity,
      precipitation,
      description: precipitation > 0 ? '비' : '맑음'
    };
    
  } catch (error) {
    console.error('❌ 기상청 API 호출 실패:', error);
    
    // Fallback: Mock 데이터 생성
    console.log('🔄 Fallback Mock 데이터 생성');
    const dayOfYear = Math.floor((new Date(date).getTime() - new Date(new Date(date).getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const baseTemp = 15;
    const tempSeasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
    const daily = 5 * Math.sin(dayOfYear * 0.1);
    const randomTemp = (Math.random() - 0.5) * 8;
    const tavg = +(baseTemp + tempSeasonal + daily + randomTemp).toFixed(1);
    
    return {
      date,
      region: 'SEOUL',
      temperature: tavg,
      humidity: Math.round(50 + Math.random() * 30),
      precipitation: Math.round(Math.random() * 5),
      description: '맑음 (Fallback)'
    };
  }
}

// Mock 기상 데이터 생성 함수
function generateMockWeatherData(date: string) {
  const d = new Date(date);
  const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  
  // 계절별 온도 분포
  const baseTemp = 15;
  const seasonal = 12 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
  const daily = 6 * Math.sin(dayOfYear * 0.1);
  const random = (Math.random() - 0.5) * 6;
  const tavg = Math.round((baseTemp + seasonal + daily + random) * 10) / 10;
  
  // 습도 계산
  const humidity = Math.round(80 - (tavg - 10) * 2 + (Math.random() - 0.5) * 20);
  const clampedHumidity = Math.max(30, Math.min(95, humidity));
  
  // 강수량 (계절별)
  const isRainySeason = dayOfYear >= 150 && dayOfYear <= 200; // 6-7월
  const precipitation = isRainySeason ? Math.random() * 20 : Math.random() * 5;
  
  return {
    date,
    region: 'SEOUL',
    temperature: tavg,
    humidity: clampedHumidity,
    precipitation: Math.round(precipitation * 10) / 10,
    description: tavg > 25 ? '맑음' : tavg > 15 ? '구름많음' : '흐림',
    source: 'mock'
  };
}

// 실제 광고 API 호출 함수 (Mock-ads 서버 사용)
async function fetchAdsData(date: string) {
  console.log(`📊 광고 API 호출: ${date}`);
  
  try {
    // Mock-ads 서버 호출
    const mockAdsUrl = process.env.MOCK_ADS_URL || 'http://localhost:8787';
    const url = `${mockAdsUrl}/api/ads?date=${date}`;
    
    console.log(`광고 API URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`광고 API 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.points || data.points.length === 0) {
      throw new Error('광고 데이터가 없습니다');
    }
    
    // 첫 번째 광고 데이터 사용
    const adData = data.points[0];
    
    console.log(`✅ 광고 데이터 수신: ${adData.channel} - ${adData.campaign}`);
    
    return {
      date,
      channel: adData.channel,
      campaign_id: adData.campaign,
      impressions: adData.impressions,
      clicks: adData.clicks,
      spend: adData.cost,
      revenue: adData.revenue,
      roas: adData.roas,
      ctr: adData.ctr,
      cpc: adData.cpc
    };
    
  } catch (error) {
    console.error('❌ 광고 API 호출 실패:', error);
    
    // Fallback: Mock 데이터 생성
    console.log('🔄 Fallback Mock 광고 데이터 생성');
    const channels = ['google', 'facebook', 'naver', 'kakao'];
    const campaigns = ['AlwaysOn', 'PromoPush', 'Seasonal', 'Brand'];
    const channel = channels[Math.floor(Math.random() * channels.length)];
    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
    
    const impressions = Math.round(1000 + Math.random() * 5000);
    const clicks = Math.round(impressions * (0.01 + Math.random() * 0.03));
    const spend = Math.round(100000 + Math.random() * 500000);
    const revenue = Math.round(spend * (1.5 + Math.random() * 1.0));
    const roas = +(revenue / spend).toFixed(2);
    
    return {
      date,
      channel,
      campaign_id: `CAMP-${date}-${campaign}`,
      impressions,
      clicks,
      spend,
      revenue,
      roas,
      ctr: +(clicks / impressions * 100).toFixed(2),
      cpc: +(spend / clicks).toFixed(2)
    };
  }
}

// 실제 매출 API 호출 함수 (Mock-cafe24 서버 사용)
async function fetchSalesData(date: string) {
  console.log(`💰 매출 API 호출: ${date}`);
  
  try {
    // Mock-cafe24 서버 호출
    const mockCafe24Url = process.env.MOCK_CAFE24_URL || 'http://localhost:3000';
    const url = `${mockCafe24Url}/api/mock/cafe24?from=${date}&to=${date}&kind=calendar`;
    
    console.log(`매출 API URL: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`매출 API 오류: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('매출 데이터가 없습니다');
    }
    
    // 매출 데이터를 sales_data 테이블 형식으로 변환
    const salesData = data.map((item: any) => ({
      date: item.date,
      region: 'SEOUL', // 기본값
      channel: 'web', // 기본값
      category: 'TOPS', // 기본값
      sku: `SKU-${item.date}`,
      revenue: item.revenue || 0,
      quantity: Math.round((item.revenue || 0) / 50000), // 추정 수량
      roas: item.roas || 2.0,
      spend: Math.round((item.revenue || 0) / (item.roas || 2.0)),
      is_event: item.is_event || false
    }));
    
    console.log(`✅ 매출 데이터 수신: ${salesData.length}개`);
    
    return salesData;
    
  } catch (error) {
    console.error('❌ 매출 API 호출 실패:', error);
    
    // Fallback: Mock 데이터 생성
    console.log('🔄 Fallback Mock 매출 데이터 생성');
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
    
    return salesData;
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

// 크론 작업 로그 저장 (테이블이 없으면 콘솔에만 출력)
async function logCronJob(jobName: string, status: string, startedAt: Date, completedAt?: Date, recordsProcessed = 0, errorMessage?: string) {
  try {
    // 로그 테이블이 없을 수 있으므로 콘솔에만 출력
    console.log(`📝 Cron Job Log: ${jobName} - ${status} - Records: ${recordsProcessed}`);
    if (errorMessage) {
      console.log(`❌ Error: ${errorMessage}`);
    }
    
    // 향후 로그 테이블이 생성되면 아래 코드 활성화
    // const { error } = await supabase
    //   .from('cron_job_logs')
    //   .insert({
    //     job_name: jobName,
    //     status,
    //     started_at: startedAt.toISOString(),
    //     completed_at: completedAt?.toISOString(),
    //     records_processed: recordsProcessed,
    //     error_message: errorMessage
    //   });
    
    // if (error) {
    //   console.error('Error logging cron job:', error);
    // }
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
    
    // 기상청 데이터만 실제 API 호출하여 DB에 저장
    console.log('🌤️ Fetching weather data from KMA API...');
    const weatherData = await fetchWeatherData(dateStr);
    
    // 데이터베이스에 저장
    console.log('💾 Saving weather data to database...');
    
    const weatherCount = await saveToDatabase([weatherData], 'weather_data');
    
    totalRecords = weatherCount;
    
    const completedAt = new Date();
    const duration = completedAt.getTime() - startedAt.getTime();
    
    console.log(`✅ ${jobName} completed successfully!`);
    console.log(`📈 Processed ${totalRecords} weather records in ${duration}ms`);
    console.log(`   - Weather: ${weatherCount} records (from KMA API and Mock data)`);
    console.log(`   - Ads/Sales: Will use mock data in web-admin`);
    
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
if (import.meta.url === `file://${process.argv[1]}`) {
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
