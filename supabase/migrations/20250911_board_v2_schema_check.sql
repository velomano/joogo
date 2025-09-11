-- 1) Inspect current fact_sales columns
--   Run manually in SQL editor to see current state
--   select column_name, data_type from information_schema.columns where table_schema='analytics' and table_name='fact_sales' order by ordinal_position;

-- 2) Safe-add missing columns expected by Board v2
alter table if exists analytics.fact_sales add column if not exists tenant_id uuid;
alter table if exists analytics.fact_sales add column if not exists date date;
alter table if exists analytics.fact_sales add column if not exists region text;
alter table if exists analytics.fact_sales add column if not exists channel text;
alter table if exists analytics.fact_sales add column if not exists sku text;
alter table if exists analytics.fact_sales add column if not exists category text;
alter table if exists analytics.fact_sales add column if not exists qty int;
alter table if exists analytics.fact_sales add column if not exists revenue numeric;
alter table if exists analytics.fact_sales add column if not exists spend numeric;
alter table if exists analytics.fact_sales add column if not exists impr_mkt int;
alter table if exists analytics.fact_sales add column if not exists clicks_mkt int;
alter table if exists analytics.fact_sales add column if not exists impr_merch int;
alter table if exists analytics.fact_sales add column if not exists clicks_merch int;
alter table if exists analytics.fact_sales add column if not exists slot_rank int;
alter table if exists analytics.fact_sales add column if not exists is_event int;
-- optional but recommended
alter table if exists analytics.fact_sales add column if not exists tavg numeric;
alter table if exists analytics.fact_sales add column if not exists unit_cost numeric;
alter table if exists analytics.fact_sales add column if not exists discount_rate numeric;
alter table if exists analytics.fact_sales add column if not exists unit_price numeric;
alter table if exists analytics.fact_sales add column if not exists campaign text;
alter table if exists analytics.fact_sales add column if not exists platform text;
alter table if exists analytics.fact_sales add column if not exists section text;

-- 3) Minimal views required by board v2 (idempotent)
create or replace view analytics.sales_calendar as
select
  date::date as date,
  sum(revenue)::numeric as revenue,
  (sum(revenue)::numeric / nullif(sum(spend)::numeric,0)) as roas,
  max(is_event)::int as is_event
from analytics.fact_sales
group by 1;

create or replace view analytics.sales_by_channel_region as
select
  date::date as date, channel, region,
  sum(revenue)::numeric as revenue,
  (sum(revenue)::numeric / nullif(sum(spend)::numeric,0)) as roas
from analytics.fact_sales
group by 1,2,3;

create or replace view analytics.sales_by_sku as
select category, sku, sum(revenue)::numeric as revenue
from analytics.fact_sales
group by 1,2;

create or replace view analytics.funnel_basic as
select date::date as date, 'marketing'::text as grp,
       sum(impr_mkt) as impr, sum(clicks_mkt) as clicks, null::int as orders
from analytics.fact_sales group by 1
union all
select date::date as date, 'merchant'::text as grp,
       sum(impr_merch) as impr, sum(clicks_merch) as clicks, sum(qty) as orders
from analytics.fact_sales group by 1;

-- 4) Optional RLS reminder (apply per-tenant if multi-tenant)
-- alter table analytics.fact_sales enable row level security;
-- create policy fact_sales_tenant on analytics.fact_sales
--   for select using (tenant_id::text = current_setting('app.current_tenant_id', true));
