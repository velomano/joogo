-- 1) Provenance columns on sales fact (non-breaking)
alter table if exists analytics.fact_sales_hourly
  add column if not exists source_type text check (source_type in ('csv','api','mock')) default 'csv',
  add column if not exists source_provider text,
  add column if not exists ingest_job_id text,
  add column if not exists is_simulated boolean default false,
  add column if not exists event_time timestamptz,
  add column if not exists ingest_time timestamptz default now();

create index if not exists idx_fact_sales_hourly_tenant_ts
  on analytics.fact_sales_hourly(tenant_id, order_hour);

-- 2) Small audit table per ingest cycle (for freshness & ops)
create table if not exists analytics.fact_source_audit (
  job_id text primary key,
  tenant_id uuid not null,
  source_type text not null,
  source_provider text not null,
  since_ts timestamptz not null,
  until_ts timestamptz not null,
  rows_ingested int not null default 0,
  created_at timestamptz not null default now()
);

-- 3) Materialized view: hourly ROAS (sales vs ad spend)
create materialized view if not exists analytics.mv_roas_hourly as
select
  f.order_hour as ts,
  f.tenant_id,
  coalesce(a.channel, 'unknown') as channel,
  sum(f.revenue) as revenue,
  sum(f.qty)     as units,
  sum(a.cost)    as ad_cost,
  case when sum(a.cost)=0 then null else sum(f.revenue)/sum(a.cost) end as roas
from analytics.fact_sales_hourly f
left join analytics.marketing_ad_spend a
  on a.ts = f.order_hour and a.tenant_id = f.tenant_id
group by 1,2,3;

create index if not exists idx_mv_roas_hourly_tenant_ts
  on analytics.mv_roas_hourly(tenant_id, ts);

-- 4) Unique index for concurrent refresh
create unique index if not exists idx_mv_roas_hourly_unique
  on analytics.mv_roas_hourly(tenant_id, ts, channel);

-- 5) Refresh helper
create or replace function analytics.refresh_mv_roas_hourly() returns void language sql as $$
  refresh materialized view concurrently analytics.mv_roas_hourly;
$$;
