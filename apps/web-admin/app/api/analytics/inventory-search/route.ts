import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Search API called with query:', query);
    
    // 실제 Supabase 재고 데이터에서 검색
    const sb = supaAdmin();
    const { data: inventoryData, error: inventoryError } = await sb
      .from('fact_sales')
      .select(`
        sku,
        product_name,
        color,
        size,
        qty,
        revenue,
        stock_on_hand,
        reorder_point,
        avg_daily_7,
        days_of_supply
      `)
      .eq('tenant_id', tenantId);

    if (inventoryError) {
      console.error('Inventory search data error:', inventoryError);
      throw inventoryError;
    }

    // 검색 필터링
    let filteredData = inventoryData || [];
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredData = filteredData.filter(item => 
        item.sku?.toLowerCase().includes(searchTerm) ||
        item.product_name?.toLowerCase().includes(searchTerm) ||
        item.color?.toLowerCase().includes(searchTerm) ||
        item.size?.toLowerCase().includes(searchTerm) ||
        (searchTerm === 'low-stock' && (item.stock_on_hand || 0) < (item.reorder_point || 0)) ||
        (searchTerm === 'out-of-stock' && (item.stock_on_hand || 0) === 0) ||
        (searchTerm === 'high-turnover' && (item.avg_daily_7 || 0) > 10) ||
        (searchTerm === 'dead-stock' && (item.avg_daily_7 || 0) < 1)
      );
    }

    // 실제 데이터를 검색 결과 형식으로 변환
    const results = filteredData.map(item => {
      const currentStock = item.stock_on_hand || 0;
      const avgDailySales = item.avg_daily_7 || 0;
      const turnoverRate = currentStock > 0 ? (avgDailySales * 30) / currentStock : 0;
      const daysOfSupply = item.days_of_supply || 0;
      const reorderPoint = item.reorder_point || 0;
      
      let status = 'in-stock';
      if (currentStock === 0) status = 'out-of-stock';
      else if (currentStock <= reorderPoint) status = 'low-stock';
      
      return {
        sku: item.sku || 'N/A',
        productName: item.product_name || '상품명 없음',
        category: item.sku?.split('-')[0] || 'OTHER',
        brand: 'Joogo', // 기본 브랜드
        currentStock: currentStock,
        avgDailySales: Number(avgDailySales.toFixed(1)),
        turnoverRate: Number(turnoverRate.toFixed(1)),
        daysOfSupply: daysOfSupply,
        reorderPoint: reorderPoint,
        unitCost: item.unit_cost || 0,
        status: status
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Inventory search API error:', error);
    return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
  }
}