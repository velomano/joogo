import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory API called with search:', search);
    
    // public.cafe24_products에서 재고 정보 조회
    const sb = supaAdmin();
    const { data: productsData, error: productsError } = await sb
      .from('cafe24_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('product_code', { ascending: true });

    if (productsError) {
      console.error('Products data error:', productsError);
      // 데이터가 없으면 빈 배열 반환 (정상적인 상태)
      console.log('No products data available - returning empty array');
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      });
    }

    // 판매 데이터에서 일평균 판매량 계산
    const { data: salesData, error: salesError } = await sb
      .from('fact_sales')
      .select('sku, qty, sale_date')
      .eq('tenant_id', tenantId)
      .gte('sale_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    if (salesError) {
      console.error('Sales data error:', salesError);
    }

    // SKU별 7일 평균 판매량 계산
    const salesBySku = new Map();
    salesData?.forEach(sale => {
      if (!salesBySku.has(sale.sku)) {
        salesBySku.set(sale.sku, { total: 0, count: 0 });
      }
      const skuData = salesBySku.get(sale.sku);
      skuData.total += sale.qty || 0;
      skuData.count += 1;
    });

    // 상품 데이터를 재고 형식으로 변환
    const inventoryData = (productsData || []).map(product => {
      const salesInfo = salesBySku.get(product.product_code) || { total: 0, count: 0 };
      const avgDaily7 = salesInfo.count > 0 ? salesInfo.total / 7 : 0;
      
      return {
        sku: product.product_code,
        product_name: product.product_name,
        color: product.color || '기본',
        size: product.size || 'ONE',
        stock_on_hand: product.stock_quantity || 0,
        avg_daily_7: Math.round(avgDaily7 * 100) / 100,
        days_of_supply: avgDaily7 > 0 ? Math.round((product.stock_quantity || 0) / avgDaily7) : 0,
        lead_time_days: product.lead_time_days || 7,
        reorder_gap_days: product.reorder_gap_days || 3,
        unit_cost: product.unit_cost || 0,
        reorder_point: product.reorder_point || 10
      };
    });

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
