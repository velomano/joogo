import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const querySchema = z.object({
  from: z.string().optional().default('2024-01-01'),
  to: z.string().optional().default(new Date().toISOString().split('T')[0]),
  region: z.string().optional(),
  channel: z.string().optional(),
  category: z.string().optional(),
  sku: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      from: searchParams.get('from'),
      to: searchParams.get('to'),
      region: searchParams.get('region'),
      channel: searchParams.get('channel'),
      category: searchParams.get('category'),
      sku: searchParams.get('sku'),
    });

    // 기본 필터 조건
    let query = supabase
      .from('sales_data')
      .select('*')
      .gte('date', params.from)
      .lte('date', params.to);

    // 추가 필터 적용
    if (params.region) {
      query = query.eq('region', params.region);
    }
    if (params.channel) {
      query = query.eq('channel', params.channel);
    }
    if (params.category) {
      query = query.eq('category', params.category);
    }
    if (params.sku) {
      query = query.eq('sku', params.sku);
    }

    const { data: salesData, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Failed to fetch sales data');
    }

    if (!salesData || salesData.length === 0) {
      // Mock 데이터 반환
      return NextResponse.json({
        totalRevenue: 0,
        totalQuantity: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        conversionRate: 0,
        roas: 0,
        totalSpend: 0,
        revenueGrowth: 0,
        quantityGrowth: 0,
        orderGrowth: 0,
        aovGrowth: 0,
        conversionGrowth: 0,
        roasGrowth: 0,
        period: {
          from: params.from,
          to: params.to,
          days: Math.ceil((new Date(params.to).getTime() - new Date(params.from).getTime()) / (1000 * 60 * 60 * 24)) + 1
        }
      });
    }

    // KPI 계산
    const totalRevenue = salesData.reduce((sum, row) => sum + (row.revenue || 0), 0);
    const totalQuantity = salesData.reduce((sum, row) => sum + (row.quantity || 0), 0);
    const totalSpend = salesData.reduce((sum, row) => sum + (row.spend || 0), 0);
    
    // 주문 수는 고유한 (date, region, channel, category, sku) 조합의 수
    const totalOrders = new Set(salesData.map(row => 
      `${row.date}-${row.region}-${row.channel}-${row.category}-${row.sku}`
    )).size;
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    
    // 전환율은 임시로 계산 (실제로는 방문자 데이터가 필요)
    const conversionRate = totalOrders > 0 ? Math.min(totalOrders / (totalOrders * 10), 1) * 100 : 0;

    // 이전 기간과 비교 (30일 전)
    const prevFrom = new Date(params.from);
    prevFrom.setDate(prevFrom.getDate() - 30);
    const prevTo = new Date(params.to);
    prevTo.setDate(prevTo.getDate() - 30);

    const { data: prevSalesData } = await supabase
      .from('sales_data')
      .select('*')
      .gte('date', prevFrom.toISOString().split('T')[0])
      .lte('date', prevTo.toISOString().split('T')[0]);

    let revenueGrowth = 0;
    let quantityGrowth = 0;
    let orderGrowth = 0;
    let aovGrowth = 0;
    let conversionGrowth = 0;
    let roasGrowth = 0;

    if (prevSalesData && prevSalesData.length > 0) {
      const prevTotalRevenue = prevSalesData.reduce((sum, row) => sum + (row.revenue || 0), 0);
      const prevTotalQuantity = prevSalesData.reduce((sum, row) => sum + (row.quantity || 0), 0);
      const prevTotalSpend = prevSalesData.reduce((sum, row) => sum + (row.spend || 0), 0);
      const prevTotalOrders = new Set(prevSalesData.map(row => 
        `${row.date}-${row.region}-${row.channel}-${row.category}-${row.sku}`
      )).size;
      const prevAvgOrderValue = prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0;
      const prevRoas = prevTotalSpend > 0 ? prevTotalRevenue / prevTotalSpend : 0;
      const prevConversionRate = prevTotalOrders > 0 ? Math.min(prevTotalOrders / (prevTotalOrders * 10), 1) * 100 : 0;

      revenueGrowth = prevTotalRevenue > 0 ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100 : 0;
      quantityGrowth = prevTotalQuantity > 0 ? ((totalQuantity - prevTotalQuantity) / prevTotalQuantity) * 100 : 0;
      orderGrowth = prevTotalOrders > 0 ? ((totalOrders - prevTotalOrders) / prevTotalOrders) * 100 : 0;
      aovGrowth = prevAvgOrderValue > 0 ? ((avgOrderValue - prevAvgOrderValue) / prevAvgOrderValue) * 100 : 0;
      conversionGrowth = prevConversionRate > 0 ? ((conversionRate - prevConversionRate) / prevConversionRate) * 100 : 0;
      roasGrowth = prevRoas > 0 ? ((roas - prevRoas) / prevRoas) * 100 : 0;
    }

    const periodDays = Math.ceil((new Date(params.to).getTime() - new Date(params.from).getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return NextResponse.json({
      totalRevenue,
      totalQuantity,
      totalOrders,
      avgOrderValue,
      conversionRate,
      roas,
      totalSpend,
      revenueGrowth,
      quantityGrowth,
      orderGrowth,
      aovGrowth,
      conversionGrowth,
      roasGrowth,
      period: {
        from: params.from,
        to: params.to,
        days: periodDays
      }
    });

  } catch (error) {
    console.error('Sales KPI API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sales KPI data' },
      { status: 500 }
    );
  }
}
