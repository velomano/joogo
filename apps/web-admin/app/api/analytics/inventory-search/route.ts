import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';

    // Mock 검색 데이터 - 실제로는 데이터베이스에서 검색
    const mockProducts = [
      {
        sku: 'SKU001',
        productName: '프리미엄 무선 이어폰',
        category: '전자제품',
        brand: 'TechBrand',
        currentStock: 150,
        avgDailySales: 12.5,
        turnoverRate: 3.2,
        daysOfSupply: 12,
        reorderPoint: 50,
        unitCost: 85000,
        status: 'in-stock'
      },
      {
        sku: 'SKU002',
        productName: '스마트워치 프로',
        category: '전자제품',
        brand: 'TechBrand',
        currentStock: 25,
        avgDailySales: 8.3,
        turnoverRate: 4.1,
        daysOfSupply: 3,
        reorderPoint: 30,
        unitCost: 320000,
        status: 'low-stock'
      },
      {
        sku: 'SKU003',
        productName: '블루투스 스피커',
        category: '전자제품',
        brand: 'AudioTech',
        currentStock: 0,
        avgDailySales: 5.2,
        turnoverRate: 2.8,
        daysOfSupply: 0,
        reorderPoint: 20,
        unitCost: 120000,
        status: 'out-of-stock'
      },
      {
        sku: 'SKU004',
        productName: '무선 충전기',
        category: '전자제품',
        brand: 'TechBrand',
        currentStock: 200,
        avgDailySales: 15.8,
        turnoverRate: 2.9,
        daysOfSupply: 13,
        reorderPoint: 40,
        unitCost: 45000,
        status: 'in-stock'
      },
      {
        sku: 'SKU005',
        productName: 'USB-C 케이블',
        category: '전자제품',
        brand: 'CablePro',
        currentStock: 8,
        avgDailySales: 22.1,
        turnoverRate: 5.2,
        daysOfSupply: 0,
        reorderPoint: 15,
        unitCost: 15000,
        status: 'low-stock'
      },
      {
        sku: 'SKU006',
        productName: '게이밍 마우스',
        category: '컴퓨터',
        brand: 'GameTech',
        currentStock: 75,
        avgDailySales: 6.7,
        turnoverRate: 3.2,
        daysOfSupply: 11,
        reorderPoint: 25,
        unitCost: 89000,
        status: 'in-stock'
      },
      {
        sku: 'SKU007',
        productName: '기계식 키보드',
        category: '컴퓨터',
        brand: 'KeyMaster',
        currentStock: 0,
        avgDailySales: 3.4,
        turnoverRate: 1.8,
        daysOfSupply: 0,
        reorderPoint: 10,
        unitCost: 180000,
        status: 'out-of-stock'
      },
      {
        sku: 'SKU008',
        productName: '모니터 암',
        category: '컴퓨터',
        brand: 'DeskPro',
        currentStock: 45,
        avgDailySales: 4.2,
        turnoverRate: 2.1,
        daysOfSupply: 11,
        reorderPoint: 20,
        unitCost: 95000,
        status: 'in-stock'
      },
      {
        sku: 'SKU009',
        productName: '노트북 스탠드',
        category: '컴퓨터',
        brand: 'DeskPro',
        currentStock: 12,
        avgDailySales: 7.8,
        turnoverRate: 4.5,
        daysOfSupply: 2,
        reorderPoint: 15,
        unitCost: 65000,
        status: 'low-stock'
      },
      {
        sku: 'SKU010',
        productName: '웹캠 4K',
        category: '컴퓨터',
        brand: 'VideoTech',
        currentStock: 30,
        avgDailySales: 2.1,
        turnoverRate: 1.2,
        daysOfSupply: 14,
        reorderPoint: 8,
        unitCost: 250000,
        status: 'in-stock'
      },
      // 의류 카테고리 상품들
      {
        sku: 'SKU101',
        productName: '오버핏 후드티',
        category: '의류',
        brand: 'StreetWear',
        currentStock: 85,
        avgDailySales: 18.5,
        turnoverRate: 4.2,
        daysOfSupply: 5,
        reorderPoint: 30,
        unitCost: 45000,
        status: 'in-stock'
      },
      {
        sku: 'SKU102',
        productName: '기본 후드티',
        category: '의류',
        brand: 'BasicBrand',
        currentStock: 12,
        avgDailySales: 25.3,
        turnoverRate: 5.8,
        daysOfSupply: 0,
        reorderPoint: 20,
        unitCost: 32000,
        status: 'low-stock'
      },
      {
        sku: 'SKU103',
        productName: '프리미엄 후드티',
        category: '의류',
        brand: 'LuxuryWear',
        currentStock: 0,
        avgDailySales: 8.7,
        turnoverRate: 2.1,
        daysOfSupply: 0,
        reorderPoint: 15,
        unitCost: 89000,
        status: 'out-of-stock'
      },
      {
        sku: 'SKU104',
        productName: '스포츠 후드티',
        category: '의류',
        brand: 'SportTech',
        currentStock: 45,
        avgDailySales: 12.2,
        turnoverRate: 3.3,
        daysOfSupply: 4,
        reorderPoint: 25,
        unitCost: 55000,
        status: 'in-stock'
      },
      {
        sku: 'SKU105',
        productName: '데님 후드티',
        category: '의류',
        brand: 'DenimCo',
        currentStock: 8,
        avgDailySales: 15.8,
        turnoverRate: 4.5,
        daysOfSupply: 1,
        reorderPoint: 18,
        unitCost: 67000,
        status: 'low-stock'
      },
      {
        sku: 'SKU106',
        productName: '기모 후드티',
        category: '의류',
        brand: 'WinterWear',
        currentStock: 120,
        avgDailySales: 6.4,
        turnoverRate: 1.8,
        daysOfSupply: 19,
        reorderPoint: 35,
        unitCost: 38000,
        status: 'in-stock'
      },
      {
        sku: 'SKU107',
        productName: '그래픽 후드티',
        category: '의류',
        brand: 'ArtWear',
        currentStock: 0,
        avgDailySales: 4.2,
        turnoverRate: 1.1,
        daysOfSupply: 0,
        reorderPoint: 12,
        unitCost: 75000,
        status: 'out-of-stock'
      },
      {
        sku: 'SKU108',
        productName: '집업 후드티',
        category: '의류',
        brand: 'ZipWear',
        currentStock: 35,
        avgDailySales: 9.1,
        turnoverRate: 2.6,
        daysOfSupply: 4,
        reorderPoint: 22,
        unitCost: 52000,
        status: 'in-stock'
      }
    ];

    // 검색 로직
    const results = mockProducts.filter(product => {
      const searchTerm = query.toLowerCase();
      return (
        product.sku.toLowerCase().includes(searchTerm) ||
        product.productName.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm) ||
        // 빠른 필터 검색
        (searchTerm === 'low-stock' && product.status === 'low-stock') ||
        (searchTerm === 'out-of-stock' && product.status === 'out-of-stock') ||
        (searchTerm === 'high-turnover' && product.turnoverRate > 4) ||
        (searchTerm === 'dead-stock' && product.turnoverRate < 2)
      );
    });

    return NextResponse.json({
      success: true,
      results: results,
      total: results.length,
      query: query
    });

  } catch (error) {
    console.error('검색 API 오류:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '검색 중 오류가 발생했습니다.',
        results: [],
        total: 0
      },
      { status: 500 }
    );
  }
}
