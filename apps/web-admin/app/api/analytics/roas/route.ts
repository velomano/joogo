export const runtime = "edge";
import { supa } from "../../../lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = url.searchParams.get("tenant_id")!;
  const from = url.searchParams.get("from") ?? new Date(Date.now()-24*3600_000).toISOString();
  const to   = url.searchParams.get("to")   ?? new Date().toISOString();

  const client = supa(); // anon 키여도 뷰 read만이면 OK(권한 설정 전제)
  const { data, error } = await client
    .from("analytics.mv_roas_hourly")       // 스키마명.테이블명 그대로 사용
    .select("ts,channel,revenue,ad_cost,roas")
    .eq("tenant_id", tenantId)
    .gte("ts", from).lte("ts", to)
    .order("ts", { ascending: true })
    .order("channel", { ascending: true });

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ rows: data }), { headers: { "content-type": "application/json" } });
}