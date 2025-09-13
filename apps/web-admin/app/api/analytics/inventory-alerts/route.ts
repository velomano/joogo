import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from') || '2024-01-01';
    const to = searchParams.get('to') || new Date().toISOString().split('T')[0];

    console.log('Inventory Alerts API called with params:', { from, to });

    // Mock 데이터 생성 (실제로는 Supabase에서 조회)
    const mockData = [
      {
        sku: 'SKU002',
        productName: '데님 재킷',
        category: '의류',
        currentStock: 25,
        reorderPoint: 30,
        daysUntilStockout: 3,
        priority: 'high',
        lastRestocked: '2024-01-15',
        supplier: '패션공급업체A',
        estimatedDelivery: '2024-01-25'
      },
      {
        sku: 'SKU007',
        productName: '후드티',
        category: '의류',
        currentStock: 18,
        reorderPoint: 35,
        daysUntilStockout: 2,
        priority: 'high',
        lastRestocked: '2024-01-10',
        supplier: '패션공급업체B',
        estimatedDelivery: '2024-01-22'
      },
      {
        sku: 'SKU004',
        productName: '가방',
        category: '액세서리',
        currentStock: 45,
        reorderPoint: 25,
        daysUntilStockout: 7,
        priority: 'medium',
        lastRestocked: '2024-01-12',
        supplier: '액세서리공급업체A',
        estimatedDelivery: '2024-01-28'
      },
      {
        sku: 'SKU009',
        productName: '스카프',
        category: '액세서리',
        currentStock: 32,
        reorderPoint: 40,
        daysUntilStockout: 4,
        priority: 'medium',
        lastRestocked: '2024-01-08',
        supplier: '액세서리공급업체B',
        estimatedDelivery: '2024-01-26'
      },
      {
        sku: 'SKU010',
        productName: '벨트',
        category: '액세서리',
        currentStock: 55,
        reorderPoint: 50,
        daysUntilStockout: 8,
        priority: 'low',
        lastRestocked: '2024-01-14',
        supplier: '액세서리공급업체C',
        estimatedDelivery: '2024-01-30'
      },
      {
        sku: 'SKU011',
        productName: '스니커즈',
        category: '신발',
        currentStock: 12,
        reorderPoint: 20,
        daysUntilStockout: 1,
        priority: 'high',
        lastRestocked: '2024-01-05',
        supplier: '신발공급업체A',
        estimatedDelivery: '2024-01-20'
      },
      {
        sku: 'SKU012',
        productName: '운동화',
        category: '신발',
        currentStock: 28,
        reorderPoint: 30,
        daysUntilStockout: 5,
        priority: 'medium',
        lastRestocked: '2024-01-13',
        supplier: '신발공급업체B',
        estimatedDelivery: '2024-01-27'
      }
    ];

    return NextResponse.json({
      success: true,
      data: mockData,
      total: mockData.length
    });

  } catch (error) {
    console.error('Inventory Alerts API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory alerts data',
        data: []
      },
      { status: 500 }
    );
  }
}
