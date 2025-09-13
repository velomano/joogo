import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];
    const category = searchParams.get('category');
    
    console.log('Product Analytics API called with params:', { from, to, category });
    
    // 기간 계산
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Joogo 시스템 아키텍처 기반 상품별 데이터
    // Product 섹션과 Salesreport 섹션의 Reports productsales 기반
    const products = [
      {
        productId: 'P001',
        productName: '프리미엄 티셔츠',
        category: 'TOPS',
        sku: 'TSH-001',
        revenue: Math.round(65000000 * daysDiff * 0.25), // 25%
        quantity: Math.round(1250 * daysDiff * 0.25),
        orders: Math.round(280 * daysDiff * 0.25),
        avgPrice: 52000,
        profit: Math.round(65000000 * daysDiff * 0.25 * 0.45), // 45% 마진
        stock: 120,
        hits: Math.round(1250 * daysDiff * 0.25 * 3.2), // 조회수
        conversionRate: 3.8,
        returnRate: 2.1
      },
      {
        productId: 'P002',
        productName: '데님 팬츠',
        category: 'BOTTOMS',
        sku: 'PTS-002',
        revenue: Math.round(65000000 * daysDiff * 0.20), // 20%
        quantity: Math.round(1250 * daysDiff * 0.20),
        orders: Math.round(280 * daysDiff * 0.20),
        avgPrice: 89000,
        profit: Math.round(65000000 * daysDiff * 0.20 * 0.52), // 52% 마진
        stock: 85,
        hits: Math.round(1250 * daysDiff * 0.20 * 2.8),
        conversionRate: 4.2,
        returnRate: 1.8
      },
      {
        productId: 'P003',
        productName: '가디건',
        category: 'OUTER',
        sku: 'CARD-003',
        revenue: Math.round(65000000 * daysDiff * 0.18), // 18%
        quantity: Math.round(1250 * daysDiff * 0.18),
        orders: Math.round(280 * daysDiff * 0.18),
        avgPrice: 125000,
        profit: Math.round(65000000 * daysDiff * 0.18 * 0.48), // 48% 마진
        stock: 45,
        hits: Math.round(1250 * daysDiff * 0.18 * 2.1),
        conversionRate: 5.1,
        returnRate: 3.2
      },
      {
        productId: 'P004',
        productName: '스니커즈',
        category: 'SHOES',
        sku: 'SNK-004',
        revenue: Math.round(65000000 * daysDiff * 0.15), // 15%
        quantity: Math.round(1250 * daysDiff * 0.15),
        orders: Math.round(280 * daysDiff * 0.15),
        avgPrice: 98000,
        profit: Math.round(65000000 * daysDiff * 0.15 * 0.38), // 38% 마진
        stock: 200,
        hits: Math.round(1250 * daysDiff * 0.15 * 4.5),
        conversionRate: 2.9,
        returnRate: 4.1
      },
      {
        productId: 'P005',
        productName: '백팩',
        category: 'BAGS',
        sku: 'BAG-005',
        revenue: Math.round(65000000 * daysDiff * 0.12), // 12%
        quantity: Math.round(1250 * daysDiff * 0.12),
        orders: Math.round(280 * daysDiff * 0.12),
        avgPrice: 78000,
        profit: Math.round(65000000 * daysDiff * 0.12 * 0.42), // 42% 마진
        stock: 65,
        hits: Math.round(1250 * daysDiff * 0.12 * 2.3),
        conversionRate: 3.5,
        returnRate: 2.8
      },
      {
        productId: 'P006',
        productName: '액세서리 세트',
        category: 'ACC',
        sku: 'ACC-006',
        revenue: Math.round(65000000 * daysDiff * 0.10), // 10%
        quantity: Math.round(1250 * daysDiff * 0.10),
        orders: Math.round(280 * daysDiff * 0.10),
        avgPrice: 35000,
        profit: Math.round(65000000 * daysDiff * 0.10 * 0.55), // 55% 마진
        stock: 150,
        hits: Math.round(1250 * daysDiff * 0.10 * 1.8),
        conversionRate: 4.8,
        returnRate: 1.5
      }
    ];
    
    // 카테고리 필터링
    const filteredProducts = category 
      ? products.filter(product => product.category === category)
      : products;
    
    // 상품별 성과 지표 계산
    const totalRevenue = filteredProducts.reduce((sum, product) => sum + product.revenue, 0);
    const totalQuantity = filteredProducts.reduce((sum, product) => sum + product.quantity, 0);
    const totalOrders = filteredProducts.reduce((sum, product) => sum + product.orders, 0);
    const totalProfit = filteredProducts.reduce((sum, product) => sum + product.profit, 0);
    
    const productAnalytics = {
      products: filteredProducts.map(product => ({
        ...product,
        revenueShare: ((product.revenue / totalRevenue) * 100).toFixed(1),
        quantityShare: ((product.quantity / totalQuantity) * 100).toFixed(1),
        profitMargin: ((product.profit / product.revenue) * 100).toFixed(1),
        inventoryTurnover: (product.quantity / product.stock).toFixed(1),
        performanceScore: ((product.conversionRate * product.avgPrice / 1000) - (product.returnRate * 0.1)).toFixed(1)
      })),
      summary: {
        totalRevenue,
        totalQuantity,
        totalOrders,
        totalProfit,
        avgPrice: (totalRevenue / totalQuantity).toFixed(0),
        avgConversionRate: (filteredProducts.reduce((sum, product) => sum + product.conversionRate, 0) / filteredProducts.length).toFixed(1),
        avgReturnRate: (filteredProducts.reduce((sum, product) => sum + product.returnRate, 0) / filteredProducts.length).toFixed(1),
        totalProfitMargin: ((totalProfit / totalRevenue) * 100).toFixed(1)
      },
      period: {
        from,
        to,
        days: daysDiff
      }
    };
    
    console.log('Returning product analytics:', productAnalytics);
    return NextResponse.json(productAnalytics);
    
  } catch (error) {
    console.error('Product Analytics API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product analytics data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
