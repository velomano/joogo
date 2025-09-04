import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const h = req.headers;
    const tenant = (h.get("x-tenant-id") ?? url.searchParams.get("tenant_id")) || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to   = url.searchParams.get("to")   || "2025-12-31";
    if (!tenant) return NextResponse.json({ error: "tenant_id missing" }, { status: 400 });

    const sb = supaAdmin();
    const [daily, roasByCh] = await Promise.all([
      sb.rpc("board_sales_daily", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_roas_by_channel", { p_tenant_id: tenant, p_from: from, p_to: to })
    ]);
    if (daily.error) throw daily.error;
    if (roasByCh.error) throw roasByCh.error;

    return NextResponse.json({
      ok: true,
      salesDaily: daily.data ?? [],
      roasByChannel: roasByCh.data ?? []
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
