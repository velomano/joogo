-- Ensure schema
create schema if not exists analytics;

-- 1) STAGE TABLE: ensure sale_date/ad_cost exist; keep legacy "date" compatible
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

-- Add original_data if missing
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='analytics' and table_name='stage_sales' and column_name='original_data'
  ) then
    alter table analytics.stage_sales add column original_data jsonb;
  end if;
end $$;

-- If sale_date missing but legacy "date" exists, add sale_date and backfill
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='analytics' and table_name='stage_sales' and column_name='sale_date'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema='analytics' and table_name='stage_sales' and column_name='date'
    ) then
      alter table analytics.stage_sales add column sale_date date;
      update analytics.stage_sales set sale_date = "date" where sale_date is null;
    else
      alter table analytics.stage_sales add column sale_date date;
      -- optional backfill from JSON if present
      update analytics.stage_sales
        set sale_date = to_date(original_data->>'date','YYYY-MM-DD')
      where sale_date is null and (original_data ? 'date');
    end if;
  end if;
end $$;

-- If ad_cost missing, create from legacy "spend" or JSON
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='analytics' and table_name='stage_sales' and column_name='ad_cost'
  ) then
    alter table analytics.stage_sales add column ad_cost numeric;
    if exists (
      select 1 from information_schema.columns
      where table_schema='analytics' and table_name='stage_sales' and column_name='spend'
    ) then
      update analytics.stage_sales set ad_cost = nullif(spend,0)::numeric where ad_cost is null;
    else
      update analytics.stage_sales
        set ad_cost = nullif((original_data->>'spend')::numeric,0)
      where ad_cost is null and (original_data ? 'spend');
    end if;
  end if;
end $$;

-- Optional: if legacy "date" column not present, add it as generated from sale_date for ingestion tools expecting "date"
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='analytics' and table_name='stage_sales' and column_name='date'
  ) then
    alter table analytics.stage_sales add column "date" date generated always as (sale_date) stored;
  end if;
end $$;

-- 2) FACT TABLE: drop and recreate to ensure proper structure
drop table if exists analytics.fact_sales cascade;

create table analytics.fact_sales (
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

-- No need for column checks since we're recreating the table with proper structure

-- Unique constraint for safe upsert by (file_id,row_num)
do $$ begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema='analytics' and table_name='fact_sales'
      and constraint_name='fact_sales_ux_file_row'
  ) then
    alter table analytics.fact_sales add constraint fact_sales_ux_file_row unique(file_id, row_num);
  end if;
end $$;

-- Indexes (use sale_date)
create index if not exists ix_fact_sales_tenant_date on analytics.fact_sales(tenant_id, sale_date);
create index if not exists ix_fact_sales_tenant_channel_date on analytics.fact_sales(tenant_id, channel, sale_date);
create index if not exists ix_fact_sales_tenant_sku on analytics.fact_sales(tenant_id, sku);
create index if not exists ix_fact_sales_original_gin on analytics.fact_sales using gin(original_data);

-- Compat view for legacy names
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

-- Merge function (stage -> fact) with upsert on (file_id,row_num)
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
end;
$$;

-- RLS minimal (server uses service_role today)
alter table analytics.fact_sales enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies
    where schemaname='analytics' and tablename='fact_sales' and policyname='tenant_isolation_read'
  ) then
    create policy tenant_isolation_read on analytics.fact_sales for select using (true);
  end if;
end $$;

-- Grants
grant select on analytics.fact_sales to anon, authenticated, service_role;
grant select on analytics.board_source_compat to anon, authenticated, service_role;
