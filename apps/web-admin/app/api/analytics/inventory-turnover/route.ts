import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Turnover API called with search:', search);
    
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
        reorder_point,
        unit_cost
      `)
      .eq('tenant_id', tenantId)
      .order('avg_daily_7', { ascending: false });

    if (inventoryError) {
      console.error('Inventory turnover data error:', inventoryError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Supabase 연결 오류: ${inventoryError.message}`,
          data: []
        },
        { status: 500 }
      );
    }

    // 실제 데이터를 재고 회전율 형식으로 변환
    const products = (inventoryData || []).map(item => {
      const currentStock = item.stock_on_hand || 0;
      const avgDailySales = item.avg_daily_7 || 0;
      const turnoverRate = currentStock > 0 ? (avgDailySales * 30) / currentStock : 0;
      const daysOfSupply = item.days_of_supply || 0;
      const reorderPoint = item.reorder_point || 0;
      
      let status = 'healthy';
      if (daysOfSupply < 3) status = 'critical';
      else if (daysOfSupply < 7) status = 'low';
      else if (daysOfSupply > 30) status = 'overstock';
      
      return {
        sku: item.sku || 'N/A',
        productName: item.product_name || '상품명 없음',
        category: item.sku?.split('-')[0] || 'OTHER',
        color: item.color || 'N/A',
        size: item.size || 'N/A',
        currentStock: currentStock,
        avgDailySales: Number(avgDailySales.toFixed(1)),
        turnoverRate: Number(turnoverRate.toFixed(1)),
        daysOfSupply: daysOfSupply,
        reorderPoint: reorderPoint,
        unitCost: item.unit_cost || 0,
        status: status
      };
    });

    // 검색 로직
    let filteredData = products;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = products.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        item.productName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.color.toLowerCase().includes(searchTerm) ||
        item.size.toLowerCase().includes(searchTerm) ||
        (searchTerm === 'low-stock' && item.status === 'low') ||
        (searchTerm === 'out-of-stock' && item.status === 'critical') ||
        (searchTerm === 'high-turnover' && item.turnoverRate > 4) ||
        (searchTerm === 'dead-stock' && item.turnoverRate < 1)
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