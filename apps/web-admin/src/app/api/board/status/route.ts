export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant_id") || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to = url.searchParams.get("to") || "2025-12-31";
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });
    }

    const sb = supaAdmin();

    // RPC 함수를 사용하여 매출 데이터 조회
    const { data: salesData, error: salesError } = await sb.rpc("board_sales_daily", {
      p_tenant_id: tenant,
      p_from: from,
      p_to: to
    });

    if (salesError) {
      console.error('[status] Sales RPC error:', salesError);
      console.warn('[status] Continuing with empty sales data due to error');
    }

    // RPC 함수를 사용하여 SKU 데이터 조회 (ABC 분석 함수 사용)
    const { data: skuData, error: skuError } = await sb.rpc("board_abc_by_sku", {
      p_tenant_id: tenant,
      p_from: from,
      p_to: to
    });

    if (skuError) {
      console.error('[status] SKU RPC error:', skuError);
      console.warn('[status] Continuing with empty SKU data due to error');
    }

    // 매출 통계 계산
    const sales = {
      totalRevenue: 0,
      totalQty: 0,
      days: 0,
      avgDaily: 0
    };

    if (salesData && Array.isArray(salesData) && salesData.length > 0) {
      const uniqueDates = new Set(salesData.map(d => d.sale_date)).size;
      const totalRevenue = salesData.reduce((sum, d) => sum + Number(d.revenue || 0), 0);
      const totalQty = salesData.reduce((sum, d) => sum + Number(d.qty || 0), 0);
      
      sales.totalRevenue = totalRevenue;
      sales.totalQty = totalQty;
      sales.days = uniqueDates;
      sales.avgDaily = uniqueDates > 0 ? totalRevenue / uniqueDates : 0;
    }

    // SKU 통계 계산
    const sku = {
      uniqueSkus: 0,
      topSku: 'N/A',
      topSkuRevenue: 0
    };

    if (skuData && Array.isArray(skuData) && skuData.length > 0) {
      const uniqueSkus = skuData.length;
      const topSkuEntry = skuData.reduce((max, d) => {
        const revenue = Number(d.revenue || 0);
        return revenue > max.revenue ? { sku: d.sku || 'Unknown', revenue } : max;
      }, { sku: 'N/A', revenue: 0 });

      sku.uniqueSkus = uniqueSkus;
      sku.topSku = topSkuEntry.sku;
      sku.topSkuRevenue = topSkuEntry.revenue;
    }

    return NextResponse.json({
      ok: true,
      sales,
      sku
    });

  } catch (e: any) {
    console.error('[/api/board/status] ERROR:', e?.message, e?.stack);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "status error"
    }, { status: 500 });
  }
}