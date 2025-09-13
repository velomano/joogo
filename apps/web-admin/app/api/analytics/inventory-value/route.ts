import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Value API called with search:', search);
    
    // public.cafe24_products에서 재고 데이터 조회
    const sb = supaAdmin();
    const { data: productsData, error: productsError } = await sb
      .from('cafe24_products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('unit_cost', { ascending: false });

    if (productsError) {
      console.error('Products data error:', productsError);
      // 데이터가 없으면 빈 배열 반환 (정상적인 상태)
      console.log('No products data available - returning empty array');
      return NextResponse.json({
        success: true,
        data: [],
        summary: {
          totalValue: 0,
          highValueItems: 0,
          mediumValueItems: 0,
          lowValueItems: 0,
          totalItems: 0
        },
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

    // 상품 데이터를 가치 분석 형식으로 변환
    const valueData = (productsData || []).map(product => {
      const currentStock = product.stock_quantity || 0;
      const unitCost = product.unit_cost || 0;
      const inventoryValue = currentStock * unitCost;
      
      const salesInfo = salesBySku.get(product.product_code) || { total: 0, count: 0 };
      const avgDailySales = salesInfo.count > 0 ? salesInfo.total / 7 : 0;
      const daysOfSupply = avgDailySales > 0 ? Math.round(currentStock / avgDailySales) : 0;
      
      let valueCategory = 'low';
      if (inventoryValue >= 10000000) valueCategory = 'high';
      else if (inventoryValue >= 5000000) valueCategory = 'medium';
      
      return {
        sku: product.product_code || 'N/A',
        productName: product.product_name || '상품명 없음',
        category: product.category || 'OTHER',
        color: product.color || 'N/A',
        size: product.size || 'N/A',
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