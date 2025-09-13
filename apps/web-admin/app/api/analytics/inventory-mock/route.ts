import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Mock API called with search:', search);
    
    // Mock 재고 데이터 생성
    const mockInventoryData = [
      {
        sku: 'TSH-001',
        product_name: '프리미엄 티셔츠',
        color: '블랙',
        size: 'L',
        stock_on_hand: 150,
        avg_daily_7: 12.5,
        days_of_supply: 12,
        lead_time_days: 5,
        reorder_gap_days: 3,
        unit_cost: 25000,
        reorder_point: 50
      },
      {
        sku: 'PTS-002',
        product_name: '데님 팬츠',
        color: '블루',
        size: '30',
        stock_on_hand: 80,
        avg_daily_7: 8.2,
        days_of_supply: 10,
        lead_time_days: 7,
        reorder_gap_days: 2,
        unit_cost: 45000,
        reorder_point: 30
      },
      {
        sku: 'JKT-003',
        product_name: '가디건',
        color: '그레이',
        size: 'M',
        stock_on_hand: 25,
        avg_daily_7: 3.1,
        days_of_supply: 8,
        lead_time_days: 4,
        reorder_gap_days: 1,
        unit_cost: 65000,
        reorder_point: 20
      },
      {
        sku: 'SNK-004',
        product_name: '스니커즈',
        color: '화이트',
        size: '270',
        stock_on_hand: 0,
        avg_daily_7: 15.8,
        days_of_supply: 0,
        lead_time_days: 10,
        reorder_gap_days: 5,
        unit_cost: 120000,
        reorder_point: 40
      },
      {
        sku: 'BAG-005',
        product_name: '백팩',
        color: '네이비',
        size: 'ONE',
        stock_on_hand: 60,
        avg_daily_7: 5.5,
        days_of_supply: 11,
        lead_time_days: 6,
        reorder_gap_days: 2,
        unit_cost: 85000,
        reorder_point: 25
      }
    ];

    // 검색 필터링
    let filteredData = mockInventoryData;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.sku?.toLowerCase().includes(searchLower) ||
        item.product_name?.toLowerCase().includes(searchLower) ||
        item.color?.toLowerCase().includes(searchLower) ||
        item.size?.toLowerCase().includes(searchLower) ||
        (searchLower === 'low-stock' && (item.stock_on_hand || 0) < (item.reorder_point || 0)) ||
        (searchLower === 'out-of-stock' && (item.stock_on_hand || 0) === 0) ||
        (searchLower === 'high-turnover' && (item.avg_daily_7 || 0) > 10) ||
        (searchLower === 'dead-stock' && (item.avg_daily_7 || 0) < 1)
      );
    }

    // 통계 계산
    const totalProducts = filteredData.length;
    const inStockProducts = filteredData.filter(item => (item.stock_on_hand || 0) > 0).length;
    const lowStockProducts = filteredData.filter(item => {
      const stock = item.stock_on_hand || 0;
      const reorderPoint = item.reorder_point || 0;
      return stock > 0 && stock <= reorderPoint;
    }).length;
    const outOfStockProducts = filteredData.filter(item => (item.stock_on_hand || 0) === 0).length;
    const totalInventoryValue = filteredData.reduce((sum, item) => 
      sum + ((item.stock_on_hand || 0) * (item.unit_cost || 0)), 0
    );
    const avgTurnoverRate = filteredData.length > 0 ? 
      filteredData.reduce((sum, item) => sum + (item.avg_daily_7 || 0), 0) / filteredData.length : 0;

    // 카테고리별 집계
    const categoryMap = new Map();
    filteredData.forEach(item => {
      const category = item.sku?.split('-')[0] || 'OTHER';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          totalProducts: 0,
          inStock: 0,
          lowStock: 0,
          outOfStock: 0,
          inventoryValue: 0,
          turnoverRate: 0
        });
      }
      
      const cat = categoryMap.get(category);
      cat.totalProducts++;
      if ((item.stock_on_hand || 0) > 0) cat.inStock++;
      if ((item.stock_on_hand || 0) > 0 && (item.stock_on_hand || 0) <= (item.reorder_point || 0)) cat.lowStock++;
      if ((item.stock_on_hand || 0) === 0) cat.outOfStock++;
      cat.inventoryValue += (item.stock_on_hand || 0) * (item.unit_cost || 0);
      cat.turnoverRate += item.avg_daily_7 || 0;
    });

    const categories = Array.from(categoryMap.values()).map(cat => ({
      ...cat,
      turnoverRate: cat.totalProducts > 0 ? cat.turnoverRate / cat.totalProducts : 0
    }));

    const responseData = {
      summary: {
        totalProducts,
        inStockProducts,
        lowStockProducts,
        outOfStockProducts,
        totalInventoryValue,
        avgTurnoverRate
      },
      categories,
      insights: {
        topCategory: categories.length > 0 ? 
          `${categories[0].category} (${categories[0].turnoverRate.toFixed(1)}회)` : 'N/A',
        attentionNeeded: outOfStockProducts > 0 ? 
          `${outOfStockProducts}개 상품 품절` : '재고 상태 양호',
        recommendation: lowStockProducts > 0 ? 
          '재고 부족 상품 재주문 필요' : '재고 상태 최적화됨'
      }
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Inventory Mock API error:', error);
    return NextResponse.json(
      { error: '재고 분석 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
