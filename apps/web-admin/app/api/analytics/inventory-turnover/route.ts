import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    console.log('Inventory Turnover API called with search:', search);

    // Mock 데이터 생성 (실제로는 Supabase에서 조회)
    const mockData = [
      {
        sku: 'SKU001',
        productName: '프리미엄 티셔츠',
        category: '의류',
        currentStock: 150,
        avgDailySales: 12.5,
        turnoverRate: 3.2,
        daysOfSupply: 12,
        reorderPoint: 50,
        status: 'healthy'
      },
      {
        sku: 'SKU002',
        productName: '데님 재킷',
        category: '의류',
        currentStock: 25,
        avgDailySales: 8.2,
        turnoverRate: 2.1,
        daysOfSupply: 3,
        reorderPoint: 30,
        status: 'critical'
      },
      {
        sku: 'SKU003',
        productName: '운동화',
        category: '신발',
        currentStock: 200,
        avgDailySales: 5.8,
        turnoverRate: 1.1,
        daysOfSupply: 34,
        reorderPoint: 40,
        status: 'overstock'
      },
      {
        sku: 'SKU004',
        productName: '가방',
        category: '액세서리',
        currentStock: 45,
        avgDailySales: 6.5,
        turnoverRate: 2.8,
        daysOfSupply: 7,
        reorderPoint: 25,
        status: 'low'
      },
      {
        sku: 'SKU005',
        productName: '시계',
        category: '액세서리',
        currentStock: 80,
        avgDailySales: 3.2,
        turnoverRate: 1.5,
        daysOfSupply: 25,
        reorderPoint: 20,
        status: 'healthy'
      },
      {
        sku: 'SKU006',
        productName: '스니커즈',
        category: '신발',
        currentStock: 120,
        avgDailySales: 15.2,
        turnoverRate: 4.1,
        daysOfSupply: 8,
        reorderPoint: 60,
        status: 'healthy'
      },
      {
        sku: 'SKU007',
        productName: '후드티',
        category: '의류',
        currentStock: 18,
        avgDailySales: 9.8,
        turnoverRate: 2.5,
        daysOfSupply: 2,
        reorderPoint: 35,
        status: 'critical'
      },
      {
        sku: 'SKU008',
        productName: '청바지',
        category: '의류',
        currentStock: 95,
        avgDailySales: 7.3,
        turnoverRate: 2.8,
        daysOfSupply: 13,
        reorderPoint: 45,
        status: 'healthy'
      }
    ];

    // 검색 로직
    let filteredData = mockData;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = mockData.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        item.productName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        // 빠른 필터 검색
        (searchTerm === 'low-stock' && item.status === 'low') ||
        (searchTerm === 'out-of-stock' && item.status === 'critical') ||
        (searchTerm === 'high-turnover' && item.turnoverRate > 4) ||
        (searchTerm === 'dead-stock' && item.turnoverRate < 2)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });

  } catch (error) {
    console.error('Inventory Turnover API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory turnover data',
        data: []
      },
      { status: 500 }
    );
  }
}
