export const runtime = "edge";
import { supa } from "@/lib/db";

export async function GET() {
  const client = supa();
  const { data, error } = await client
    .from("analytics.fact_sales_hourly")
    .select("count")
    .limit(1);
  if (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
  return new Response(JSON.stringify({ ok: true, count: data?.[0]?.count ?? 0 }), {
    headers: { "content-type": "application/json" }
  });
}
