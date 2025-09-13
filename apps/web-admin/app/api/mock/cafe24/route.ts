import { NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    console.log('Cafe24 Mock API called (Supabase)');
    const url = new URL(req.url);
    const from = url.searchParams.get('from') ?? '2025-01-01';
    const to = url.searchParams.get('to') ?? '2025-12-31';
    const kind = url.searchParams.get('kind') ?? 'calendar';
    
    console.log('Cafe24 API params:', { from, to, kind });
    
    // 필터 파라미터들
    const region = url.searchParams.get('region')?.split(',') || [];
    const channel = url.searchParams.get('channel')?.split(',') || [];
    const category = url.searchParams.get('category')?.split(',') || [];
    const sku = url.searchParams.get('sku')?.split(',') || [];
    
    console.log('Mock API 필터:', { from, to, kind, region, channel, category, sku });
    
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    const sb = supaAdmin();

    if (kind === 'calendar') {
      console.log('Fetching calendar data from public.fact_sales');
      
      // public.fact_sales에서 일별 매출 집계
      let query = sb
        .from('fact_sales')
        .select(`
          sale_date,
          revenue,
          qty,
          channel,
          region,
          tavg,
          ad_cost
        `)
        .eq('tenant_id', tenantId)
        .gte('sale_date', from)
        .lte('sale_date', to)
        .order('sale_date', { ascending: true });

      // 필터 적용
      if (region.length > 0) {
        query = query.in('region', region);
      }
      if (channel.length > 0) {
        query = query.in('channel', channel);
      }
      if (category.length > 0) {
        query = query.in('category', category);
      }
      if (sku.length > 0) {
        query = query.in('sku', sku);
      }

      const { data: salesData, error: salesError } = await query;
      
      if (salesError) {
        console.error('Sales data query error:', salesError);
        // 테이블이 없거나 오류가 있으면 빈 배열 반환 (정상적인 상태)
        console.log('No data available - returning empty array');
        return NextResponse.json([]);
      }

      // 일별 집계
      const dailyData = new Map();
      
      salesData?.forEach(sale => {
        const date = sale.sale_date;
        if (!dailyData.has(date)) {
          dailyData.set(date, {
            date,
            revenue: 0,
            quantity: 0,
            orders: 0,
            ad_cost: 0,
            tavg: 0,
            channels: new Set(),
            regions: new Set()
          });
        }
        
        const dayData = dailyData.get(date);
        dayData.revenue += sale.revenue || 0;
        dayData.quantity += sale.qty || 0;
        dayData.ad_cost += sale.ad_cost || 0;
        dayData.tavg = sale.tavg || 20; // 마지막 값으로 덮어쓰기
        dayData.channels.add(sale.channel);
        dayData.regions.add(sale.region);
        dayData.orders += 1; // 각 판매 레코드를 주문으로 계산
      });

      // 결과 배열 생성
      const result = Array.from(dailyData.values()).map(dayData => {
        // 이벤트 여부 (매월 1일, 15일)
        const date = new Date(dayData.date);
        const isEvent = date.getDate() === 1 || date.getDate() === 15;
        
        // ROAS 계산 (광고비 대비 매출)
        const roas = dayData.ad_cost > 0 ? dayData.revenue / dayData.ad_cost : 2.0;

        return {
          date: dayData.date,
          revenue: Math.round(dayData.revenue),
          quantity: dayData.quantity,
          orders: dayData.orders,
          roas: Math.round(roas * 100) / 100,
          is_event: isEvent,
          tavg: Math.round(dayData.tavg * 10) / 10
        };
      });

      console.log('Fetched calendar data length:', result.length);
      return NextResponse.json(result);
    }

    if (kind === 'channel_region') {
      console.log('Fetching channel_region data from public.fact_sales');
      
      // public.fact_sales에서 채널/지역별 매출 집계
      let query = sb
        .from('fact_sales')
        .select(`
          sale_date,
          channel,
          region,
          revenue,
          ad_cost
        `)
        .eq('tenant_id', tenantId)
        .gte('sale_date', from)
        .lte('sale_date', to)
        .order('sale_date', { ascending: true });

      // 필터 적용
      if (region.length > 0) {
        query = query.in('region', region);
      }
      if (channel.length > 0) {
        query = query.in('channel', channel);
      }
      if (category.length > 0) {
        query = query.in('category', category);
      }
      if (sku.length > 0) {
        query = query.in('sku', sku);
      }

      const { data: salesData, error: salesError } = await query;
      
      if (salesError) {
        console.error('Sales data query error:', salesError);
        console.log('No data available - returning empty array');
        return NextResponse.json([]);
      }

      // 채널/지역별 매출 집계
      const regionChannelMap = new Map<string, { revenue: number; ad_cost: number }>();
      
      salesData?.forEach(sale => {
        const key = `${sale.sale_date}-${sale.channel}-${sale.region}`;
        if (!regionChannelMap.has(key)) {
          regionChannelMap.set(key, { revenue: 0, ad_cost: 0 });
        }
        
        const data = regionChannelMap.get(key)!;
        data.revenue += sale.revenue || 0;
        data.ad_cost += sale.ad_cost || 0;
      });

      // 결과 배열 생성
      const result = Array.from(regionChannelMap.entries()).map(([key, data]) => {
        const [date, channel, region] = key.split('-');
        const roas = data.ad_cost > 0 ? data.revenue / data.ad_cost : 0;
        
        return {
          date,
          channel,
          region,
          revenue: Math.round(data.revenue),
          roas: Math.round(roas * 100) / 100
        };
      });

      console.log('Fetched channel_region data length:', result.length);
      return NextResponse.json(result);
    }

    if (kind === 'treemap' || kind === 'treemap_pareto') {
      console.log('Fetching treemap data from public.fact_sales');
      
      // public.fact_sales에서 SKU별 매출 집계
      let query = sb
        .from('fact_sales')
        .select(`
          sku,
          category,
          revenue,
          ad_cost
        `)
        .eq('tenant_id', tenantId)
        .gte('sale_date', from)
        .lte('sale_date', to);

      // 필터 적용
      if (region.length > 0) {
        query = query.in('region', region);
      }
      if (channel.length > 0) {
        query = query.in('channel', channel);
      }
      if (category.length > 0) {
        query = query.in('category', category);
      }
      if (sku.length > 0) {
        query = query.in('sku', sku);
      }

      const { data: salesData, error: salesError } = await query;
      
      if (salesError) {
        console.error('Sales data query error:', salesError);
        console.log('No data available - returning empty array');
        return NextResponse.json([]);
      }

      // SKU별 매출 집계
      const skuMap = new Map<string, { category: string; revenue: number; ad_cost: number }>();
      
      salesData?.forEach(sale => {
        const skuKey = sale.sku || 'UNKNOWN';
        if (!skuMap.has(skuKey)) {
          skuMap.set(skuKey, { 
            category: sale.category || 'OTHER', 
            revenue: 0, 
            ad_cost: 0 
          });
        }
        
        const data = skuMap.get(skuKey)!;
        data.revenue += sale.revenue || 0;
        data.ad_cost += sale.ad_cost || 0;
      });

      // 결과 배열 생성
      const result = Array.from(skuMap.entries()).map(([sku, data]) => {
        const roas = data.ad_cost > 0 ? data.revenue / data.ad_cost : 0;
        
        return {
          category: data.category,
          sku,
          revenue: Math.round(data.revenue),
          roas: Math.round(roas * 100) / 100
        };
      });

      console.log('Fetched treemap data length:', result.length);
      return NextResponse.json(result);
    }

    console.log('Unknown kind, returning default response');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Mock API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}