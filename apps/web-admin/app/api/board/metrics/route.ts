import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../../lib/supabase/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const h = req.headers;
    const tenant = (h.get("x-tenant-id") ?? url.searchParams.get("tenant_id")) || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to   = url.searchParams.get("to")   || "2025-12-31";
    if (!tenant) return NextResponse.json({ error: "tenant_id missing" }, { status: 400 });

    const sb = supaAdmin();
    const { data, error } = await sb.rpc("board_get_kpis", {
      p_tenant_id: tenant,
      p_from: from,
      p_to: to
    });
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : data;
    return NextResponse.json({ ok: true, kpi: row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
