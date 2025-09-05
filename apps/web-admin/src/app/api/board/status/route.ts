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

    // 매출 데이터 조회
    const { data: salesData, error: salesError } = await sb
      .from('analytics.fact_sales')
      .select('sale_date, qty, revenue')
      .eq('tenant_id', tenant)
      .gte('sale_date', from)
      .lte('sale_date', to);

    if (salesError) {
      console.error('[status] Sales query error:', salesError);
      throw salesError;
    }

    // SKU 데이터 조회
    const { data: skuData, error: skuError } = await sb
      .from('analytics.fact_sales')
      .select('sku, revenue')
      .eq('tenant_id', tenant)
      .gte('sale_date', from)
      .lte('sale_date', to);

    if (skuError) {
      console.error('[status] SKU query error:', skuError);
      throw skuError;
    }

    // 매출 통계 계산
    const sales = {
      totalRevenue: 0,
      totalQty: 0,
      days: 0,
      avgDaily: 0
    };

    if (salesData && salesData.length > 0) {
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

    if (skuData && skuData.length > 0) {
      const skuRevenue = skuData.reduce((acc, d) => {
        const sku = d.sku || 'Unknown';
        acc[sku] = (acc[sku] || 0) + Number(d.revenue || 0);
        return acc;
      }, {} as Record<string, number>);

      const uniqueSkus = Object.keys(skuRevenue).length;
      const topSkuEntry = Object.entries(skuRevenue).reduce((max, [sku, revenue]) => 
        revenue > max[1] ? [sku, revenue] : max, ['N/A', 0]);

      sku.uniqueSkus = uniqueSkus;
      sku.topSku = topSkuEntry[0];
      sku.topSkuRevenue = topSkuEntry[1];
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