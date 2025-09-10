export const runtime = "edge";
import { supa } from "@/lib/db";

export async function POST() {
  const client = supa();
  const { error } = await client.rpc("refresh_mv_roas_hourly");
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ ok: true }));
}