import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory API called with search:', search);
    
    const sb = supaAdmin();
    
    // 실제 Supabase 재고 데이터 조회
    const { data: inventoryData, error: inventoryError } = await sb
      .from('fact_inventory')
      .select(`
        sku,
        product_name,
        color,
        size,
        stock_on_hand,
        avg_daily_7,
        days_of_supply,
        lead_time_days,
        reorder_gap_days,
        unit_cost,
        reorder_point
      `)
      .eq('tenant_id', tenantId)
      .order('stock_on_hand', { ascending: true });

    if (inventoryError) {
      console.error('Inventory data error:', inventoryError);
      throw inventoryError;
    }

    // 검색 필터링
    let filteredData = inventoryData || [];
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

    // 실제 데이터 기반 통계 계산
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

    // 카테고리별 집계 (실제 데이터 기반)
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
    console.error('Inventory analysis API error:', error);
    return NextResponse.json(
      { error: '재고 분석 데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}
