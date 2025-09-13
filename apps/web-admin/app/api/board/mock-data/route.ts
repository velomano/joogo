import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export const runtime = 'edge';

// 시드 기반 랜덤 생성기
function seedRand(seed: number) {
  let s = seed;
  return () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
}

// 고정 시드로 일관된 데이터 생성
const FIXED_SEED = 12345;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00',
      from = '2024-01-01',
      to = '2025-12-31',
      regenerate = false,
      clearAll = false,
      action
    } = body;

    console.log('Mock data generation started:', { tenantId, from, to, regenerate, clearAll, action });

    const sb = supaAdmin();
    const rng = seedRand(FIXED_SEED);

    // 주문 상태 코드 컬럼 추가 액션 처리
    if (action === 'add_order_status_columns') {
      console.log('Adding order status columns to fact_sales table...');
      
      try {
        // fact_sales 테이블에 카페24 API 표준 주문 상태 코드 컬럼 추가
        await sb.rpc('exec_sql', {
          sql: `
            ALTER TABLE public.fact_sales 
            ADD COLUMN IF NOT EXISTS order_status_code VARCHAR(10),
            ADD COLUMN IF NOT EXISTS order_status_name VARCHAR(50),
            ADD COLUMN IF NOT EXISTS shipping_status_code VARCHAR(10),
            ADD COLUMN IF NOT EXISTS shipping_status_name VARCHAR(50),
            ADD COLUMN IF NOT EXISTS payment_status_code VARCHAR(10),
            ADD COLUMN IF NOT EXISTS payment_status_name VARCHAR(50);
          `
        });

        // 인덱스 생성
        await sb.rpc('exec_sql', {
          sql: `
            CREATE INDEX IF NOT EXISTS idx_fact_sales_order_status_code ON public.fact_sales(order_status_code);
            CREATE INDEX IF NOT EXISTS idx_fact_sales_shipping_status_code ON public.fact_sales(shipping_status_code);
            CREATE INDEX IF NOT EXISTS idx_fact_sales_payment_status_code ON public.fact_sales(payment_status_code);
          `
        });

        console.log('Order status columns added successfully');
        return NextResponse.json({
          success: true,
          message: 'Order status columns added successfully',
          columns: [
            'order_status_code',
            'order_status_name', 
            'shipping_status_code',
            'shipping_status_name',
            'payment_status_code',
            'payment_status_name'
          ]
        });
      } catch (error) {
        console.error('Error adding order status columns:', error);
        return NextResponse.json({
          success: false,
          error: 'Failed to add order status columns',
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    }

    // 기존 데이터 삭제 (regenerate가 true인 경우)
    if (regenerate) {
      console.log('Deleting existing mock data...');
      await Promise.all([
        sb.from('cafe24_weather').delete().eq('tenant_id', tenantId),
        sb.from('cafe24_customers').delete().eq('tenant_id', tenantId),
        sb.from('cafe24_products').delete().eq('tenant_id', tenantId),
        sb.from('cafe24_marketing').delete().eq('tenant_id', tenantId),
        sb.from('fact_sales').delete().eq('tenant_id', tenantId),
        sb.from('ads_data').delete().eq('tenant_id', tenantId)
      ]);
    }

    // 모든 데이터 완전 삭제 (clearAll이 true인 경우)
    if (clearAll) {
      console.log('Clearing ALL data from all tables...');
      await Promise.all([
        sb.from('cafe24_weather').delete().neq('id', 0), // 모든 데이터 삭제
        sb.from('cafe24_customers').delete().neq('id', 0),
        sb.from('cafe24_products').delete().neq('id', 0),
        sb.from('cafe24_marketing').delete().neq('id', 0),
        sb.from('fact_sales').delete().neq('id', 0),
        sb.from('ads_data').delete().neq('id', 0)
      ]);
      console.log('All data cleared successfully');
      return NextResponse.json({
        success: true,
        message: 'All data cleared successfully',
        data: { cleared: true }
      });
    }

    const startDate = new Date(from);
    const endDate = new Date(to);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 1. 상품 데이터 생성
    console.log('Generating products...');
    const products: any[] = [];
    const categories = ['TOPS', 'BOTTOMS', 'OUTER', 'ACCESSORIES', 'SHOES', 'BAGS'];
    const brands = ['Joogo', 'Premium', 'Basic', 'Luxury', 'Sport'];
    const colors = ['블랙', '화이트', '네이비', '그레이', '레드', '핑크', '브라운'];
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'ONE'];

    for (const category of categories) {
      for (let i = 1; i <= 10; i++) {
        const productId = `${category}-${String(i).padStart(3, '0')}`;
        const brand = brands[Math.floor(rng() * brands.length)];
        const color = colors[Math.floor(rng() * colors.length)];
        const size = sizes[Math.floor(rng() * sizes.length)];
        
        products.push({
          tenant_id: tenantId,
          product_code: productId,
          product_name: `${brand} ${category} ${i}호`,
        category,
          price: Math.round((50 + rng() * 200) * 1000), // 5만원~25만원
          stock_quantity: Math.floor(10 + rng() * 200),
          color: colors[Math.floor(rng() * colors.length)],
          size: sizes[Math.floor(rng() * sizes.length)]
      });
    }
  }
  
    await sb.from('cafe24_products').insert(products);
    console.log(`Generated ${products.length} products`);

    // 2. 고객 데이터 생성
    console.log('Generating customers...');
    const customers: any[] = [];
    const firstNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임'];
    const lastNames = ['민수', '지영', '현우', '서연', '준호', '수진', '동현', '미영', '성민', '예진'];
    const membershipLevels = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const regions = ['SEOUL', 'BUSAN', 'DAEGU', 'INCHEON', 'GWANGJU', 'DAEJEON', 'ULSAN', 'GYEONGGI'];

    for (let i = 1; i <= 1000; i++) {
      const firstName = firstNames[Math.floor(rng() * firstNames.length)];
      const lastName = lastNames[Math.floor(rng() * lastNames.length)];
      const customerId = `CUST-${String(i).padStart(6, '0')}`;
      const membershipLevel = membershipLevels[Math.floor(rng() * membershipLevels.length)];
      const region = regions[Math.floor(rng() * regions.length)];
      
      customers.push({
        tenant_id: tenantId,
        customer_id: customerId,
        customer_name: `${firstName}${lastName}`,
        email: `customer${i}@example.com`,
        grade: membershipLevel,
        total_spent: Math.round((100000 + rng() * 5000000)),
        order_count: Math.floor(rng() * 50)
      });
    }

    await sb.from('cafe24_customers').insert(customers);
    console.log(`Generated ${customers.length} customers`);

    // 3. 날씨 데이터 처리 (기존 데이터 확인 후 생성)
    console.log('Processing weather data...');
    
    // 기존 기상청 데이터 확인
    const { data: existingWeather, error: weatherCheckError } = await sb
      .from('weather_data')
      .select('date, region, temperature, humidity, precipitation, description')
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: true });

    if (weatherCheckError) {
      console.error('Weather check error:', weatherCheckError);
    }

    let weatherData: any[] = [];
    
    if (existingWeather && existingWeather.length > 0) {
      console.log(`Found ${existingWeather.length} existing weather records, converting to cafe24_weather format`);
      
      // 기존 기상청 데이터를 cafe24_weather 형식으로 변환
      weatherData = existingWeather.map(item => ({
        tenant_id: tenantId,
        date: item.date,
        region: item.region,
        temperature_avg: item.temperature,
        temperature_min: Math.round((item.temperature - 3 - rng() * 3) * 10) / 10,
        temperature_max: Math.round((item.temperature + 3 + rng() * 3) * 10) / 10,
        humidity: item.humidity,
        precipitation: item.precipitation,
        wind_speed: Math.round(rng() * 10 * 10) / 10,
        weather_condition: item.description || '맑음'
      }));
    } else {
      console.log('No existing weather data found, generating new weather data...');
      
      // 기존 데이터가 없으면 새로 생성
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        
        for (const region of regions) {
          const baseTemp = 15;
          const tempSeasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
          const daily = 5 * Math.sin(dayOfYear * 0.1);
          const random = (rng() - 0.5) * 8;
          const tavg = Math.round((baseTemp + tempSeasonal + daily + random) * 10) / 10;
          
          weatherData.push({
            tenant_id: tenantId,
            date: date.toISOString().split('T')[0],
            region,
            temperature_avg: tavg,
            temperature_min: Math.round((tavg - 5 - rng() * 5) * 10) / 10,
            temperature_max: Math.round((tavg + 5 + rng() * 5) * 10) / 10,
            humidity: Math.floor(40 + rng() * 40),
            precipitation: Math.round(rng() * 20 * 10) / 10,
            wind_speed: Math.round(rng() * 10 * 10) / 10,
            weather_condition: rng() > 0.7 ? '비' : rng() > 0.5 ? '흐림' : '맑음'
          });
        }
      }
    }

    await sb.from('cafe24_weather').insert(weatherData);
    console.log(`Processed ${weatherData.length} weather records`);

    // 4. 광고 데이터 생성
    console.log('Generating marketing data...');
    const marketingData: any[] = [];
    const channels = ['google', 'facebook', 'naver', 'kakao', 'instagram'];
    const campaignTypes = ['브랜드', '프로모션', '리타겟팅', '신규고객', '재구매'];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      for (const channel of channels) {
        const campaignId = `CAMP-${channel.toUpperCase()}-${date.toISOString().split('T')[0]}`;
        const campaignType = campaignTypes[Math.floor(rng() * campaignTypes.length)];
        const baseSpend = 100000 + rng() * 500000;
        const impressions = Math.floor(10000 + rng() * 50000);
        const clicks = Math.floor(impressions * (0.01 + rng() * 0.03));
        const conversions = Math.floor(clicks * (0.02 + rng() * 0.05));
        const revenue = Math.round(conversions * (50000 + rng() * 200000));
        
        marketingData.push({
          tenant_id: tenantId,
          start_date: date.toISOString().split('T')[0],
          channel,
          campaign_name: `${campaignType} 캠페인 ${date.getMonth() + 1}월`,
          impressions,
          clicks,
          spend: baseSpend,
          revenue,
          roas: Math.round((revenue / baseSpend) * 100) / 100,
          ctr: Math.round((clicks / impressions) * 10000) / 100,
          cpc: Math.round((baseSpend / clicks) * 100) / 100
        });
      }
    }

    await sb.from('cafe24_marketing').insert(marketingData);
    console.log(`Generated ${marketingData.length} marketing records`);

    // 5. fact_sales 데이터 생성 (주문 데이터를 fact_sales 형식으로)
    console.log('Generating fact_sales data...');
    const factSalesData: any[] = [];
    let orderCounter = 1;

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = date.getDate() === 1 || date.getDate() === 15;
      
      // 주문 수 대폭 줄이기 (빠른 생성)
      let dailyOrders = Math.floor(2 + rng() * 5); // 2-7개로 줄임
      if (isWeekend) dailyOrders = Math.floor(dailyOrders * 1.5);
      if (isHoliday) dailyOrders = Math.floor(dailyOrders * 2);
      
      for (let j = 0; j < dailyOrders; j++) {
        const customer = customers[Math.floor(rng() * customers.length)];
        const channel = ['web', 'app', 'mobile', 'kiosk', 'offline'][Math.floor(rng() * 5)];
        const region = regions[Math.floor(rng() * regions.length)];
        
        // 주문 상품 수 (1-5개)
        const itemCount = Math.floor(1 + rng() * 5);
        let totalAmount = 0;
        let totalDiscount = 0;
        
        for (let k = 0; k < itemCount; k++) {
          const product = products[Math.floor(rng() * products.length)];
          const quantity = Math.floor(1 + rng() * 3);
          const discountRate = rng() > 0.8 ? rng() * 0.3 : 0; // 20% 확률로 할인
          const unitPrice = product.price * (1 - discountRate);
          const itemTotal = unitPrice * quantity;
          
          totalAmount += itemTotal;
          totalDiscount += product.price * quantity - itemTotal;
          
          // fact_sales에 추가
          factSalesData.push({
            tenant_id: tenantId,
            sale_date: date.toISOString().split('T')[0],
            region,
            channel,
            category: product.category,
            sku: product.product_code,
            product_name: product.product_name,
            color: product.color,
            size: product.size,
            qty: quantity,
            revenue: Math.round(itemTotal),
            ad_cost: Math.round(itemTotal * 0.1), // 광고비 추정
            discount_rate: Math.round(discountRate * 10000) / 100,
            tavg: weatherData.find(w => w.date === date.toISOString().split('T')[0] && w.region === region)?.temperature_avg || 20
          });
        }
        
        orderCounter++;
      }
    }

    // fact_sales 데이터 삽입
    await sb.from('fact_sales').insert(factSalesData);
    console.log(`Generated ${factSalesData.length} fact_sales records`);

    // 6. ads_data 생성 (2주에 한두번 광고하는 패턴)
    console.log('Generating ads_data...');
    const adsData: any[] = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dayOfWeek = date.getDay();
      const dayOfMonth = date.getDate();
      
      // 2주에 한두번 광고하는 패턴 (월요일, 목요일에만 광고)
      const isAdDay = (dayOfWeek === 1 || dayOfWeek === 4) && (rng() > 0.5); // 50% 확률로 광고
      
      if (isAdDay) {
        // 광고하는 날에는 1-2개 채널에서만 광고 (데이터량 줄이기)
        const activeChannels = channels.slice(0, Math.floor(1 + rng() * 2));
        
        for (const channel of activeChannels) {
        const campaignId = `CAMP-${channel.toUpperCase()}-${date.toISOString().split('T')[0]}`;
        const campaignType = campaignTypes[Math.floor(rng() * campaignTypes.length)];
        const baseSpend = 100000 + rng() * 500000;
        const impressions = Math.floor(10000 + rng() * 50000);
        const clicks = Math.floor(impressions * (0.01 + rng() * 0.03));
        const conversions = Math.floor(clicks * (0.02 + rng() * 0.05));
        const revenue = Math.round(conversions * (50000 + rng() * 200000));
        
        adsData.push({
          tenant_id: tenantId,
          date: date.toISOString().split('T')[0],
          channel,
          campaign_id: campaignId,
          campaign_name: `${campaignType} 캠페인 ${date.getMonth() + 1}월`,
          ad_group_id: `AG-${channel}-${i}`,
          ad_group_name: `${campaignType} 광고그룹`,
          ad_id: `AD-${channel}-${i}`,
          ad_name: `${campaignType} 광고 ${i}`,
          ad_type: ['search', 'display', 'video', 'shopping', 'social'][Math.floor(rng() * 5)],
          keyword: `${campaignType} 키워드`,
          placement: ['search_network', 'display_network', 'youtube', 'facebook_feed'][Math.floor(rng() * 4)],
          device_type: ['desktop', 'mobile', 'tablet'][Math.floor(rng() * 3)],
          country: 'KR',
          region: regions[Math.floor(rng() * regions.length)],
          age_group: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'][Math.floor(rng() * 6)],
          gender: ['male', 'female', 'unknown'][Math.floor(rng() * 3)],
          budget_amount: baseSpend * 1.2,
          bid_strategy: ['manual_cpc', 'target_cpa', 'target_roas', 'maximize_clicks'][Math.floor(rng() * 4)],
          bid_amount: Math.round(baseSpend / clicks * 100) / 100,
          quality_score: Math.floor(1 + rng() * 10),
          impressions,
          clicks,
          conversions,
          conversion_value: revenue,
          cost: baseSpend,
          spend: baseSpend,
          revenue,
          ctr: Math.round((clicks / impressions) * 10000) / 100,
          cpc: Math.round((baseSpend / clicks) * 100) / 100,
          cpm: Math.round((baseSpend / impressions) * 1000 * 100) / 100,
          cpa: Math.round((baseSpend / conversions) * 100) / 100,
          roas: Math.round((revenue / baseSpend) * 100) / 100,
          roi: Math.round(((revenue - baseSpend) / baseSpend) * 10000) / 100,
          conversion_rate: Math.round((conversions / clicks) * 10000) / 100,
          bounce_rate: Math.round((20 + rng() * 60) * 100) / 100,
          session_duration: Math.round((60 + rng() * 300) * 100) / 100,
          new_users: Math.floor(conversions * (0.3 + rng() * 0.4)),
          returning_users: Math.floor(conversions * (0.3 + rng() * 0.4)),
          video_views: Math.floor(impressions * (0.1 + rng() * 0.3)),
          video_completion_rate: Math.round((20 + rng() * 60) * 100) / 100,
          video_engagement_rate: Math.round((10 + rng() * 40) * 100) / 100,
          utm_source: channel,
          utm_medium: ['cpc', 'cpm', 'cpa', 'organic'][Math.floor(rng() * 4)],
          utm_campaign: campaignId,
          utm_term: `${campaignType} 키워드`,
          utm_content: `광고 ${i}`
        });
        }
      }
    }

    // ads_data 삽입
    await sb.from('ads_data').insert(adsData);
    console.log(`Generated ${adsData.length} ads_data records`);
    
  return NextResponse.json({
      success: true,
      message: 'Mock data generated successfully',
      data: {
        products: products.length,
        customers: customers.length,
        weather: weatherData.length,
        marketing: marketingData.length,
        factSales: factSalesData.length,
        adsData: adsData.length,
        dateRange: { from, to, days }
      }
    });

  } catch (error) {
    console.error('Mock data generation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate mock data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}