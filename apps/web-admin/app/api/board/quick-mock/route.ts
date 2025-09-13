import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00',
      from = '2025-01-01',
      to = '2025-09-13'
    } = body;

    console.log('Quick mock data generation started');

    // 간단한 Mock 데이터 생성 (전처럼 빠르게)
    const factSalesData = [];
    const adsData = [];
    const productsData = [];

    const startDate = new Date(from);
    const endDate = new Date(to);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // 1. 간단한 fact_sales 데이터 (100개)
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate.getTime() + (i % days) * 24 * 60 * 60 * 1000);
      factSalesData.push({
        tenant_id: tenantId,
        sale_date: date.toISOString().split('T')[0],
        region: ['SEOUL', 'BUSAN', 'DAEGU'][i % 3],
        channel: ['web', 'app', 'mobile'][i % 3],
        category: ['TOPS', 'BOTTOMS', 'OUTER'][i % 3],
        sku: `SKU-${String(i).padStart(3, '0')}`,
        product_name: `상품 ${i}`,
        color: ['블랙', '화이트', '네이비'][i % 3],
        size: ['S', 'M', 'L'][i % 3],
        qty: Math.floor(1 + Math.random() * 5),
        revenue: Math.floor(50000 + Math.random() * 200000),
        ad_cost: Math.floor(5000 + Math.random() * 20000),
        discount_rate: Math.random() * 0.3,
        tavg: 15 + Math.random() * 20
      });
    }

    // 2. 간단한 ads_data (50개)
    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate.getTime() + (i % days) * 24 * 60 * 60 * 1000);
      adsData.push({
        tenant_id: tenantId,
        date: date.toISOString().split('T')[0],
        channel: ['google', 'facebook', 'naver'][i % 3],
        campaign_name: `캠페인 ${i}`,
        impressions: Math.floor(1000 + Math.random() * 5000),
        clicks: Math.floor(50 + Math.random() * 200),
        conversions: Math.floor(5 + Math.random() * 20),
        cost: Math.floor(10000 + Math.random() * 50000),
        revenue: Math.floor(20000 + Math.random() * 100000),
        ctr: Math.random() * 5,
        cpc: Math.random() * 1000,
        roas: Math.random() * 5
      });
    }

    // 3. 간단한 products 데이터 (30개)
    for (let i = 0; i < 30; i++) {
      productsData.push({
        tenant_id: tenantId,
        product_code: `PROD-${String(i).padStart(3, '0')}`,
        product_name: `상품 ${i}`,
        category: ['TOPS', 'BOTTOMS', 'OUTER'][i % 3],
        price: Math.floor(10000 + Math.random() * 100000),
        stock_quantity: Math.floor(10 + Math.random() * 100),
        color: ['블랙', '화이트', '네이비'][i % 3],
        size: ['S', 'M', 'L'][i % 3]
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Quick mock data generated successfully',
      data: {
        factSales: factSalesData.length,
        adsData: adsData.length,
        products: productsData.length,
        factSalesData,
        adsData,
        productsData
      }
    });

  } catch (error) {
    console.error('Quick mock data generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate quick mock data' },
      { status: 500 }
    );
  }
}
