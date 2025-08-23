-- Extensions
create extension if not exists pgcrypto;

-- Schemas
create schema if not exists raw;
create schema if not exists dim;
create schema if not exists fact;
create schema if not exists ops;
create schema if not exists audit;
create schema if not exists ext;
create schema if not exists ml;

-- Raw file meta (uploaded CSV)
create table if not exists raw.selmate_file (
  file_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  filename text not null,
  uploaded_at timestamptz not null default now(),
  columns jsonb not null,
  row_count int not null,
  sha256 text not null unique,
  source_format text default 'selmate_3m_wide_v1',
  template_version text
);

-- Raw row (wide → daily_qty JSONB)
create table if not exists raw.selmate_row (
  file_id uuid references raw.selmate_file(file_id) on delete cascade,
  row_idx int not null,
  product_name text,
  option_name text,
  location_code text,
  on_hand numeric,
  extra jsonb default '{}'::jsonb,
  daily_qty jsonb not null,
  primary key (file_id, row_idx)
);

-- Dimensions (location optional for analysis)
create table if not exists dim.sku (
  sku_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  product_name text not null,
  option_name text,
  category text,
  supplier_id uuid,
  brand text,
  tags text[],
  status text default 'active',
  unique (tenant_id, product_name, coalesce(option_name,''))
);

create table if not exists dim.location (
  location_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  location_code text not null,
  aisle text generated always as (split_part(location_code,'-',1)) stored,
  rack_no int  generated always as (nullif(split_part(location_code,'-',2),'')::int) stored,
  unique (tenant_id, location_code)
);

-- Facts
create table if not exists fact.sales_daily (
  tenant_id uuid not null,
  sku_id uuid not null references dim.sku(sku_id),
  location_id uuid references dim.location(location_id),
  sales_date date not null,
  qty numeric not null,
  revenue numeric,
  cost numeric,
  returns_qty numeric default 0,
  channel text,
  source_file_id uuid references raw.selmate_file(file_id),
  source_row_idx int,
  last_updated_at timestamptz not null default now(),
  primary key (tenant_id, sku_id, location_id, sales_date)
);

create table if not exists fact.inventory_snapshot (
  tenant_id uuid not null,
  sku_id uuid not null references dim.sku(sku_id),
  location_id uuid references dim.location(location_id),
  snapshot_date date not null,
  on_hand numeric not null,
  on_order numeric default 0,
  source_file_id uuid references raw.selmate_file(file_id),
  source_row_idx int,
  primary key (tenant_id, sku_id, location_id, snapshot_date)
);

-- External factors
create table if not exists ext.weather_daily (
  tenant_id uuid not null,
  region text not null,
  date date not null,
  tmax numeric, tmin numeric, rain_mm numeric, humidity numeric,
  primary key (tenant_id, region, date)
);

create table if not exists dim.event (
  tenant_id uuid not null,
  event_id uuid primary key default gen_random_uuid(),
  name text, type text,
  start_date date, end_date date,
  discount_pct numeric, ad_spend numeric
);

-- Recommendations
create table if not exists ops.replenishment_rec (
  tenant_id uuid not null,
  sku_id uuid not null,
  recommended_qty numeric,
  stockout_date date,
  params_json jsonb,
  reason text,
  created_at timestamptz default now()
);

create table if not exists ops.discontinue_rec (
  tenant_id uuid not null,
  sku_id uuid not null,
  score numeric,
  reason text,
  created_at timestamptz default now()
);

-- Upserts
create or replace function dim.upsert_sku(_tenant uuid, _p text, _o text)
returns uuid language plpgsql as $$
declare _id uuid;
begin
  select sku_id into _id from dim.sku
   where tenant_id=_tenant and product_name=_p and coalesce(option_name,'')=coalesce(_o,'');
  if _id is null then
    insert into dim.sku(tenant_id, product_name, option_name)
    values(_tenant,_p,_o) returning sku_id into _id;
  end if;
  return _id;
end $$;

create or replace function dim.upsert_location(_tenant uuid, _loc text)
returns uuid language plpgsql as $$
declare _id uuid;
begin
  if _loc is null then return null; end if;
  select location_id into _id from dim.location where tenant_id=_tenant and location_code=_loc;
  if _id is null then
    insert into dim.location(tenant_id, location_code) values(_tenant,_loc)
    returning location_id into _id;
  end if;
  return _id;
end $$;

-- Loader: raw → facts
create or replace procedure fact.load_selmate_file(_file uuid)
language plpgsql as $$
declare r record;
        _tenant uuid;
        _sku uuid;
        _loc uuid;
        k text; v text; d date; q numeric;
begin
  select tenant_id into _tenant from raw.selmate_file where file_id=_file;

  for r in select * from raw.selmate_row where file_id=_file loop
    _sku := dim.upsert_sku(_tenant, r.product_name, r.option_name);
    _loc := dim.upsert_location(_tenant, r.location_code);

    if r.on_hand is not null then
      insert into fact.inventory_snapshot(tenant_id, sku_id, location_id, snapshot_date, on_hand, source_file_id, source_row_idx)
      values(_tenant, _sku, _loc, (now() at time zone 'Asia/Seoul')::date, r.on_hand, _file, r.row_idx)
      on conflict (tenant_id, sku_id, location_id, snapshot_date) do update
        set on_hand=excluded.on_hand, source_file_id=_file, source_row_idx=r.row_idx, snapshot_date=excluded.snapshot_date;
    end if;

    for k, v in select * from jsonb_each_text(r.daily_qty) loop
      d := to_date(k,'YYYYMMDD');
      q := nullif(v,'')::numeric;
      if q is not null and q<>0 then
        insert into fact.sales_daily(tenant_id, sku_id, location_id, sales_date, qty, source_file_id, source_row_idx)
        values(_tenant, _sku, _loc, d, q, _file, r.row_idx)
        on conflict (tenant_id, sku_id, location_id, sales_date) do update
          set qty = fact.sales_daily.qty + excluded.qty,
              source_file_id=_file, source_row_idx=r.row_idx, last_updated_at=now();
      end if;
    end loop;
  end loop;
end $$;

-- Materialized views (analysis-first)
create materialized view if not exists fact.v_daily_shipments as
select tenant_id, sales_date, sum(qty) as qty
from fact.sales_daily group by 1,2;

create materialized view if not exists fact.v_recent30_by_sku as
select tenant_id, sku_id, sum(qty) as qty_30d
from fact.sales_daily
where sales_date >= (now() at time zone 'Asia/Seoul')::date - interval '30 days'
group by 1,2;

create materialized view if not exists fact.v_inactive_90 as
with last_sale as (
  select tenant_id, sku_id, max(sales_date) as last_sale_date
  from fact.sales_daily group by 1,2
)
select i.tenant_id, i.sku_id, max(i.on_hand) as on_hand, ls.last_sale_date
from fact.inventory_snapshot i
left join last_sale ls on ls.tenant_id=i.tenant_id and ls.sku_id=i.sku_id
group by 1,2, ls.last_sale_date
having coalesce(ls.last_sale_date, date '1900-01-01') < (now() at time zone 'Asia/Seoul')::date - interval '90 days'
   and max(i.on_hand) > 0;

create materialized view if not exists fact.v_abc_recent30 as
with ranked as (
  select tenant_id, sku_id, sum(qty) qty_30d
  from fact.sales_daily
  where sales_date >= (current_date - interval '30 days')
  group by 1,2
), ordered as (
  select *,
         sum(qty_30d) over (partition by tenant_id) total_qty,
         sum(qty_30d) over (partition by tenant_id order by qty_30d desc) cum_qty
  from ranked
)
select tenant_id, sku_id, qty_30d,
       case when cum_qty/total_qty <= 0.80 then 'A'
            when cum_qty/total_qty <= 0.95 then 'B'
            else 'C' end as abc_class
from ordered;

-- Indexes
create index if not exists idx_sales_daily_date on fact.sales_daily(tenant_id, sales_date);
create index if not exists idx_sales_daily_sku on fact.sales_daily(tenant_id, sku_id);

-- RLS switches (policies to be added later)
alter table raw.selmate_file enable row level security;
alter table raw.selmate_row  enable row level security;
alter table dim.sku         enable row level security;
alter table dim.location    enable row level security;
alter table fact.sales_daily enable row level security;
alter table fact.inventory_snapshot enable row level security;

-- PO draft tables
create table if not exists ops.po_draft (
  tenant_id uuid not null,
  draft_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  supplier text,
  total_amount numeric,
  status text default 'draft'   -- draft / approved / canceled
);

create table if not exists ops.po_draft_items (
  draft_id uuid references ops.po_draft(draft_id) on delete cascade,
  sku_id uuid not null,
  qty numeric not null,
  unit_cost numeric,
  eta_date date,
  primary key (draft_id, sku_id)
);

-- audit log
create table if not exists audit.actions (
  tenant_id uuid not null,
  user_id text,
  action_type text not null,   -- simulate / approve / snooze / autopilot_run
  payload_json jsonb not null,
  created_at timestamptz not null default now()
);

-- autopilot rule table
create table if not exists ops.autopilot_rule (
  tenant_id uuid not null,
  rule_id uuid primary key default gen_random_uuid(),
  name text not null,
  enabled boolean default true,
  params jsonb not null,        -- {"coverage_days":7, "L":7, "z":1.645, "budget_limit":1000000}
  created_at timestamptz default now()
);


