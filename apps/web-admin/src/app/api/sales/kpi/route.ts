import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    // 임시로 Mock 데이터만 반환 (Supabase 연결 문제 해결 전까지)
    const periodDays = Math.ceil((new Date(params.to).getTime() - new Date(params.from).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Mock 데이터 생성
    const baseRevenue = 50000000; // 5천만원
    const baseQuantity = 1000;
    const baseOrders = 200;
    const baseSpend = 10000000; // 1천만원
    
    const totalRevenue = baseRevenue + Math.random() * 20000000;
    const totalQuantity = baseQuantity + Math.floor(Math.random() * 500);
    const totalOrders = baseOrders + Math.floor(Math.random() * 100);
    const totalSpend = baseSpend + Math.random() * 5000000;
    
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    const conversionRate = Math.random() * 5; // 0-5%
    
    // 성장률 (랜덤)
    const revenueGrowth = (Math.random() - 0.5) * 40; // -20% ~ +20%
    const quantityGrowth = (Math.random() - 0.5) * 30;
    const orderGrowth = (Math.random() - 0.5) * 25;
    const aovGrowth = (Math.random() - 0.5) * 20;
    const conversionGrowth = (Math.random() - 0.5) * 15;
    const roasGrowth = (Math.random() - 0.5) * 30;

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
