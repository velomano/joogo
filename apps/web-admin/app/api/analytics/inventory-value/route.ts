import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Value API called with search:', search);
    
    // 실제 Supabase 재고 데이터에서 가치 분석 데이터 조회
    const sb = supaAdmin();
    const { data: inventoryData, error: inventoryError } = await sb
      .from('fact_sales')
      .select(`
        sku,
        product_name,
        color,
        size,
        qty,
        revenue
      `)
      .eq('tenant_id', tenantId)
      .order('unit_cost', { ascending: false });

    if (inventoryError) {
      console.error('Inventory value data error:', inventoryError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Supabase 연결 오류: ${inventoryError.message}`,
          data: []
        },
        { status: 500 }
      );
    }

    // 실제 데이터를 가치 분석 형식으로 변환
    const valueData = (inventoryData || []).map(item => {
      const currentStock = item.stock_on_hand || 0;
      const unitCost = item.unit_cost || 0;
      const inventoryValue = currentStock * unitCost;
      const avgDailySales = item.avg_daily_7 || 0;
      const daysOfSupply = item.days_of_supply || 0;
      
      let valueCategory = 'low';
      if (inventoryValue >= 10000000) valueCategory = 'high';
      else if (inventoryValue >= 5000000) valueCategory = 'medium';
      
      return {
        sku: item.sku || 'N/A',
        productName: item.product_name || '상품명 없음',
        category: item.sku?.split('-')[0] || 'OTHER',
        color: item.color || 'N/A',
        size: item.size || 'N/A',
        currentStock: currentStock,
        unitCost: unitCost,
        inventoryValue: inventoryValue,
        avgDailySales: Number(avgDailySales.toFixed(1)),
        daysOfSupply: daysOfSupply,
        valueCategory: valueCategory
      };
    });

    // 검색 필터링
    let filteredData = valueData;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredData = valueData.filter(item => 
        item.sku.toLowerCase().includes(searchTerm) ||
        item.productName.toLowerCase().includes(searchTerm) ||
        item.category.toLowerCase().includes(searchTerm) ||
        item.color.toLowerCase().includes(searchTerm) ||
        item.size.toLowerCase().includes(searchTerm) ||
        (searchTerm === 'high' && item.valueCategory === 'high') ||
        (searchTerm === 'medium' && item.valueCategory === 'medium') ||
        (searchTerm === 'low' && item.valueCategory === 'low')
      );
    }

    // 가치별 집계
    const totalValue = filteredData.reduce((sum, item) => sum + item.inventoryValue, 0);
    const highValueItems = filteredData.filter(item => item.valueCategory === 'high').length;
    const mediumValueItems = filteredData.filter(item => item.valueCategory === 'medium').length;
    const lowValueItems = filteredData.filter(item => item.valueCategory === 'low').length;

    return NextResponse.json({
      success: true,
      data: filteredData,
      summary: {
        totalValue: totalValue,
        highValueItems: highValueItems,
        mediumValueItems: mediumValueItems,
        lowValueItems: lowValueItems,
        totalItems: filteredData.length
      },
      total: filteredData.length
    });

  } catch (error) {
    console.error('Inventory Value API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory value data',
        data: []
      },
      { status: 500 }
    );
  }
}