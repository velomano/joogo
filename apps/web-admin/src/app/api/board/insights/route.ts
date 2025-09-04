export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant_id") || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to   = url.searchParams.get("to")   || "2025-12-31";
    const region   = url.searchParams.get("region");
    const channel  = url.searchParams.get("channel");
    const category = url.searchParams.get("category");
    const sku      = url.searchParams.get("sku");
    const z    = Number(url.searchParams.get("z") ?? "1.65");
    const lt   = Number(url.searchParams.get("lead_time") ?? "7");
    
    if (!tenant) return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });

    const sb = supaAdmin();
    const [
      tempReg, spendReg, abc, rop, eol, movers
    ] = await Promise.all([
      sb.rpc("board_reg_qty_tavg", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_reg_rev_spend", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_abc_by_sku", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_reorder_points", { p_tenant_id: tenant, p_from: from, p_to: to, p_lead_time_days: lt, p_z: z }),
      sb.rpc("board_eol_candidates", { p_tenant_id: tenant }),
      sb.rpc("board_top_movers", { p_tenant_id: tenant, p_to: to })
    ]);

    const get0 = (r: any) => Array.isArray(r?.data) ? (r.data[0] ?? null) : null;
    const asArr= (r: any) => Array.isArray(r?.data) ? r.data : [];

    const temp = get0(tempReg);
    const spend= get0(spendReg);
    
    const payload = {
      ok: true,
      tempReg: temp,          // slope, r2, elasticity …
      spendReg: spend,        // marginal_roas …
      abc: asArr(abc),        // sku, revenue, grade …
      reorder: asArr(rop),    // sku, reorder_point …
      eol: asArr(eol),        // sku, days_since …
      movers: asArr(movers),  // sku, zscore, direction
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "insights error" }, { status: 500 });
  }
}
