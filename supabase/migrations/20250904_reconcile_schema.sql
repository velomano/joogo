-- Schema: analytics (idempotent)
create schema if not exists analytics;

-- Staging table: flexible columns + JSONB original_data
create table if not exists analytics.stage_sales (
  tenant_id uuid,
  file_id uuid,
  row_num int,
  sale_date date,
  region text,
  channel text,
  category text,
  sku text,
  qty numeric,
  revenue numeric,
  ad_cost numeric,
  discount_rate numeric,
  tavg numeric,
  original_data jsonb,
  created_at timestamptz default now()
);

do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='analytics' and table_name='stage_sales' and column_name='original_data'
  ) then
    alter table analytics.stage_sales add column original_data jsonb;
  end if;
end $$;

-- Fact table: normalized for analytics
create table if not exists analytics.fact_sales (
  id bigserial primary key,
  tenant_id uuid not null,
  sale_date date not null,
  region text,
  channel text,
  category text,
  sku text,
  qty numeric,
  revenue numeric,
  ad_cost numeric,
  discount_rate numeric,
  tavg numeric,
  file_id uuid,
  row_num int,
  original_data jsonb,
  created_at timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists ix_fact_sales_tenant_date on analytics.fact_sales(tenant_id, sale_date);
create index if not exists ix_fact_sales_tenant_channel_date on analytics.fact_sales(tenant_id, channel, sale_date);
create index if not exists ix_fact_sales_tenant_sku on analytics.fact_sales(tenant_id, sku);
create index if not exists ix_fact_sales_original_gin on analytics.fact_sales using gin(original_data);

-- Uniqueness per file row to support safe upsert
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='analytics' and table_name='fact_sales' and constraint_type='UNIQUE'
      and constraint_name='fact_sales_ux_file_row'
  ) then
    alter table analytics.fact_sales add constraint fact_sales_ux_file_row unique(file_id, row_num);
  end if;
end $$;

-- Optional integrity checks (not validated yet)
alter table analytics.fact_sales
  add constraint fact_sales_nonneg_revenue check (revenue is null or revenue >= 0) not valid;
alter table analytics.fact_sales
  add constraint fact_sales_nonneg_adcost check (ad_cost is null or ad_cost >= 0) not valid;

-- Compatibility view: maps legacy names (date, spend)
drop view if exists analytics.board_source_compat;
create view analytics.board_source_compat as
select
  tenant_id,
  sale_date as "date",
  region,
  channel,
  category,
  sku,
  qty,
  revenue,
  ad_cost as spend,
  discount_rate,
  tavg,
  file_id,
  row_num,
  original_data
from analytics.fact_sales;

comment on view analytics.board_source_compat is
'Legacy-compatible view mapping sale_date→date, ad_cost→spend for older code/CSV logic';

-- Merge function: stage → fact (per file)
create or replace function analytics.merge_stage_to_fact(p_tenant_id uuid, p_file_id uuid)
returns void
language plpgsql
as $$
begin
  insert into analytics.fact_sales
  (
    tenant_id, sale_date, region, channel, category, sku,
    qty, revenue, ad_cost, discount_rate, tavg,
    file_id, row_num, original_data
  )
  select
    s.tenant_id,
    s.sale_date,
    nullif(trim(s.region),''),
    nullif(trim(s.channel),''),
    nullif(trim(s.category),''),
    nullif(trim(s.sku),''),
    nullif(s.qty,0)::numeric,
    nullif(s.revenue,0)::numeric,
    nullif(s.ad_cost,0)::numeric,
    nullif(s.discount_rate,0)::numeric,
    s.tavg,
    s.file_id,
    s.row_num,
    s.original_data
  from analytics.stage_sales s
  where s.tenant_id = p_tenant_id
    and s.file_id = p_file_id
  on conflict on constraint fact_sales_ux_file_row do update
    set tenant_id = excluded.tenant_id,
        sale_date = excluded.sale_date,
        region = excluded.region,
        channel = excluded.channel,
        category = excluded.category,
        sku = excluded.sku,
        qty = excluded.qty,
        revenue = excluded.revenue,
        ad_cost = excluded.ad_cost,
        discount_rate = excluded.discount_rate,
        tavg = excluded.tavg,
        original_data = excluded.original_data;

  -- Optional: clear staging after merge
  -- delete from analytics.stage_sales where tenant_id=p_tenant_id and file_id=p_file_id;
end;
$$;

-- RLS: enabled; policy minimal because server uses service_role today
alter table analytics.fact_sales enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='analytics' and tablename='fact_sales' and policyname='tenant_isolation_read'
  ) then
    create policy tenant_isolation_read on analytics.fact_sales
      for select using (true);
  end if;
end $$;

-- Grants
grant select on analytics.fact_sales to anon, authenticated, service_role;
grant select on analytics.board_source_compat to anon, authenticated, service_role;
