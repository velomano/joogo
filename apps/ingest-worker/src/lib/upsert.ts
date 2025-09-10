import { createClient } from "@supabase/supabase-js";

export type UpsertCtx = {
  supabaseUrl: string;
  supabaseServiceKey: string;
  tenantId: string;
  jobId: string;
  isSimulated: boolean;
  sourceType: "csv" | "api" | "mock";
  sourceProvider: string;
};

export function supaAdmin(ctx: UpsertCtx) {
  return createClient(ctx.supabaseUrl, ctx.supabaseServiceKey, { auth: { persistSession: false } });
}

// idempotent upsert into analytics.marketing_ad_spend
export async function upsertAdSpend(ctx: UpsertCtx, rows: Array<{ ts: string; channel: string; campaign_id: string; impressions: number; clicks: number; cost: number; }>) {
  if (!rows.length) return;
  const supa = supaAdmin(ctx);
  const payload = rows.map(r => ({ ...r, tenant_id: ctx.tenantId }));
  const { error } = await supa.from("analytics.marketing_ad_spend").upsert(payload, { onConflict: "ts,channel,campaign_id,tenant_id" });
  if (error) throw error;
  await supa.from("analytics.fact_source_audit").upsert([{
    job_id: ctx.jobId, tenant_id: ctx.tenantId, source_type: ctx.sourceType, source_provider: ctx.sourceProvider,
    since_ts: new Date(Math.min(...rows.map(r => Date.parse(r.ts)))).toISOString(),
    until_ts: new Date(Math.max(...rows.map(r => Date.parse(r.ts)))).toISOString(),
    rows_ingested: rows.length
  }]);
}

// idempotent upsert into analytics.weather_hourly
export async function upsertWeather(ctx: UpsertCtx, rows: Array<{ ts: string; location: string; temp_c: number; humidity: number; rain_mm: number; wind_mps: number; }>) {
  if (!rows.length) return;
  const supa = supaAdmin(ctx);
  const payload = rows.map(r => ({ ...r, tenant_id: ctx.tenantId }));
  const { error } = await supa.from("analytics.weather_hourly").upsert(payload, { onConflict: "ts,location,tenant_id" });
  if (error) throw error;
}

// idempotent upsert into analytics.fact_sales_hourly with provenance
export async function upsertSalesHourly(ctx: UpsertCtx, rows: Array<{ order_hour: string; revenue: number; qty: number; }>) {
  if (!rows.length) return;
  const supa = supaAdmin(ctx);
  // Your table may have different columns; adjust to your schema.
  const payload = rows.map(r => ({
    order_hour: r.order_hour,
    revenue: r.revenue,
    qty: r.qty,
    tenant_id: ctx.tenantId,
    source_type: ctx.sourceType,
    source_provider: ctx.sourceProvider,
    ingest_job_id: ctx.jobId,
    is_simulated: ctx.isSimulated,
    event_time: r.order_hour,
    ingest_time: new Date().toISOString()
  }));
  const { error } = await supa.from("analytics.fact_sales_hourly").upsert(payload, { ignoreDuplicates: false });
  if (error) throw error;
}
