import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Mock API called with search:', search);
    
    // public.fact_sales에서 재고 데이터 조회
    const sb = supaAdmin();
    const { data: salesData, error: salesError } = await sb
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
      .order('sku', { ascending: true });

    if (salesError) {
      console.error('Sales data error:', salesError);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      });
    }

    // fact_sales 데이터를 재고 형식으로 변환
    const inventoryData = (salesData || []).map(item => ({
      sku: item.sku,
      product_name: item.product_name || `상품-${item.sku}`,
      color: item.color || '기본',
      size: item.size || 'ONE',
      stock_on_hand: 0, // 재고 수량은 0으로 설정
      avg_daily_7: item.qty || 0,
      days_of_supply: 0,
      lead_time_days: 0,
      reorder_gap_days: 0,
      unit_cost: 0,
      reorder_point: 0
    }));

    // 검색 필터링
    let filteredData = inventoryData;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredData = inventoryData.filter(item => 
        item.sku?.toLowerCase().includes(searchLower) ||
        item.product_name?.toLowerCase().includes(searchLower) ||
        item.color?.toLowerCase().includes(searchLower) ||
        item.size?.toLowerCase().includes(searchLower)
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      total: filteredData.length
    });
    
  } catch (error) {
    console.error('Inventory Mock API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory mock data',
        data: []
      },
      { status: 500 }
    );
  }
}