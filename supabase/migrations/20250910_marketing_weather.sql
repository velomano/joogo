-- Marketing ad spend (aggregated)
create table if not exists analytics.marketing_ad_spend (
  ts timestamptz not null,
  channel text not null,
  campaign_id text not null,
  impressions int not null default 0,
  clicks int not null default 0,
  cost numeric not null default 0,
  tenant_id uuid not null,
  primary key (ts, channel, campaign_id, tenant_id)
);

-- Weather hourly
create table if not exists analytics.weather_hourly (
  ts timestamptz not null,
  location text not null,
  temp_c int,
  humidity int,
  rain_mm int,
  wind_mps numeric,
  tenant_id uuid not null,
  primary key (ts, location, tenant_id)
);

-- Simple attribution rollup view (join sales with ads/weather by hour)
create or replace view analytics.fact_attribution as
select
  f.order_hour as ts,
  f.tenant_id,
  coalesce(a.channel, 'unknown') as channel,
  sum(f.revenue) as revenue,
  sum(f.qty) as units,
  sum(a.cost) as ad_cost,
  sum(a.clicks) as clicks,
  avg(w.temp_c) as avg_temp_c,
  avg(w.rain_mm) as avg_rain_mm
from analytics.fact_sales_hourly f
left join analytics.marketing_ad_spend a
  on a.ts = f.order_hour and a.tenant_id = f.tenant_id
left join analytics.weather_hourly w
  on w.ts = f.order_hour and w.tenant_id = f.tenant_id
group by 1,2,3;
