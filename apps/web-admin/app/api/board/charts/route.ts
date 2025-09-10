export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../../lib/supabase/server";

// tiny per-process cache: key = `${tenant}|${from}|${to}`
const _cache = new Map<string, { ts: number; payload: any }>();
const TTL_MS = 0; // 캐시 비활성화

// 캐시 초기화
_cache.clear();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const h = req.headers;
    const tenant = (h.get("x-tenant-id") ?? url.searchParams.get("tenant_id")) || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to   = url.searchParams.get("to")   || "2025-12-31";
    const region   = url.searchParams.get("region");
    const channel  = url.searchParams.get("channel");
    const category = url.searchParams.get("category");
    const sku      = url.searchParams.get("sku");
    
    console.log(`[charts] Request: tenant=${tenant}, from=${from}, to=${to}`);
    
    if (!tenant) return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });

    const key = `${tenant}|${from}|${to}`;
    const now = Date.now();
    const cached = _cache.get(key);
    if (cached && now - cached.ts < TTL_MS) {
      console.log(`[charts] Cache hit for key: ${key}`);
      const res = NextResponse.json(cached.payload);
      res.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
      return res;
    }

    console.log(`[charts] Cache miss, calling Supabase RPCs for key: ${key}`);
    const sb = supaAdmin();
    
    const [
      daily,
      roasByCh,
      topCat,
      topReg,
      topSku,
      cumRev,
      tempVs,
      spendRev
    ] = await Promise.all([
      sb.rpc("board_sales_daily", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_roas_by_channel", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_top_categories", { p_tenant_id: tenant, p_from: from, p_to: to, p_limit: 10 }),
      sb.rpc("board_top_categories", { p_tenant_id: tenant, p_from: from, p_to: to, p_limit: 10 }),
      sb.rpc("board_top_skus", { 
        p_tenant_id: tenant, 
        p_from: from, 
        p_to: to, 
        p_limit: 10,
        p_region: null,
        p_channel: null,
        p_category: null,
        p_sku: null
      }),
      sb.rpc("board_cumulative_revenue", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_temp_vs_sales", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_spend_rev_daily", { p_tenant_id: tenant, p_from: from, p_to: to })
    ]);

    const all = [daily, roasByCh, topCat, topReg, topSku, cumRev, tempVs, spendRev];
    const err = all.find(x => x.error);
    if (err) {
      console.error("[charts] RPC error:", err.error);
      throw err.error;
    }

    const asArr = (r: any) => (Array.isArray(r?.data) ? r.data : []);
    
    // 디버깅: daily 데이터 확인
    console.log('[charts] Daily RPC result:', daily);
    console.log('[charts] Daily data array:', asArr(daily));
    console.log('[charts] First daily item:', asArr(daily)[0]);
    
    const payload = {
      ok: true,
      salesDaily: asArr(daily),
      roasByChannel: asArr(roasByCh),
      topCategories: asArr(topCat),
      topRegions: asArr(topReg),
      topSkus: asArr(topSku),
      cumulativeRevenue: asArr(cumRev),
      tempVsSales: asArr(tempVs),
      spendRevDaily: asArr(spendRev),
    };
    _cache.set(key, { ts: now, payload });
    console.log(`[charts] Success: ${payload.salesDaily.length} daily, ${payload.roasByChannel.length} channels, ${payload.topCategories.length} categories, ${payload.topRegions.length} regions, ${payload.topSkus.length} skus, ${payload.cumulativeRevenue.length} cumulative`);
    
    const res = NextResponse.json(payload);
    res.headers.set("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
    return res;
  } catch (e: any) {
    console.error("[/api/board/charts] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
