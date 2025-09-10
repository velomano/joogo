export const runtime = "edge";

import { supaServer } from "@/lib/db";

export async function GET() {
  try {
    const supa = supaServer();
    const { data, error } = await supa
      .from("analytics.fact_sales_hourly")
      .select("count")
      .limit(1);

    if (error) throw error;
    return new Response(JSON.stringify({ ok: true, count: data?.[0]?.count ?? 0 }), {
      headers: { "content-type": "application/json" }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: String(e?.message ?? e) }), { status: 500 });
  }
}
