export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../../lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant_id") || "84949b3c-2cb7-4c42-b9f9-d1f37d371e00";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to = url.searchParams.get("to") || "2025-12-31";
    const limit = parseInt(url.searchParams.get("limit") || "10");

    console.log(`[data-preview] Request: tenant=${tenant}, from=${from}, to=${to}, limit=${limit}`);

    const sb = supaAdmin();
    
    // 실제 데이터 조회 (상품명과 옵션 포함)
    const { data: salesData, error: salesError } = await sb
      .from('fact_sales')
      .select(`
        date,
        region,
        channel,
        sku,
        product_name,
        color,
        size,
        qty,
        revenue
      `)
      .eq('tenant_id', tenant)
      .gte('date', from)
      .lte('date', to)
      .order('date', { ascending: false })
      .limit(limit);

    if (salesError) {
      console.error('[data-preview] Sales data error:', salesError);
      throw salesError;
    }

    // 재고 데이터 조회
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
        reorder_gap_days
      `)
      .eq('tenant_id', tenant)
      .order('stock_on_hand', { ascending: true })
      .limit(limit);

    if (inventoryError) {
      console.error('[data-preview] Inventory data error:', inventoryError);
      // 재고 데이터가 없어도 계속 진행
    }

    // 데이터 포맷팅
    const formattedSalesData = salesData?.map(row => [
      row.date,
      row.region,
      row.channel,
      row.sku,
      row.product_name || '상품명 없음',
      `${row.color || 'N/A'}/${row.size || 'N/A'}`,
      row.qty?.toString() || '0',
      row.revenue?.toString() || '0'
    ]) || [];

    const formattedInventoryData = inventoryData?.map(row => [
      row.sku,
      row.product_name || '상품명 없음',
      `${row.color || 'N/A'}/${row.size || 'N/A'}`,
      row.stock_on_hand?.toString() || '0',
      row.avg_daily_7?.toString() || '0',
      row.days_of_supply?.toString() || '0',
      row.lead_time_days?.toString() || '0',
      row.reorder_gap_days?.toString() || '0'
    ]) || [];

    return NextResponse.json({
      ok: true,
      sales: {
        columns: ['date', 'region', 'channel', 'sku', 'product_name', 'options', 'qty', 'revenue'],
        data: formattedSalesData
      },
      inventory: {
        columns: ['sku', 'product_name', 'options', 'stock_on_hand', 'avg_daily_7', 'days_of_supply', 'lead_time_days', 'reorder_gap_days'],
        data: formattedInventoryData
      }
    });

  } catch (error: any) {
    console.error('[data-preview] Error:', error);
    return NextResponse.json({ 
      ok: false,
      error: error.message || 'Data preview failed' 
    }, { status: 500 });
  }
}
