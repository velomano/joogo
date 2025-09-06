-- 0040_board_rpc_reset.sql
-- 원격 DB 연결 문제 우회를 위한 완전 초기화 + 재생성

set role postgres;

-- B-1. 모든 오버로드 강제 드롭 (public/analytics 전부)
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure::text as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where p.proname in ('board_sales_daily', 'board_roas_by_channel', 'board_top_categories', 'board_top_regions', 'board_top_skus', 'board_abc_by_sku', 'board_inventory_analysis')
      and n.nspname in ('public','analytics')
  loop
    execute format('drop function if exists %s cascade;', r.sig);
  end loop;
end$$;

-- B-2. 내부 구현(analytics.*) 재생성 - public.sales 기반
create schema if not exists analytics;

-- analytics.board_sales_daily
create or replace function analytics.board_sales_daily(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int
)
language sql stable security definer
as $$
  with f as (
    select
      s.sale_date::date as date,
      coalesce(s.qty,0)::numeric as qty,
      coalesce(s.revenue,0)::numeric as revenue,
      null::numeric as spend,
      null::numeric as tavg,
      0::int as is_event,
      s.channel::text as channel,
      s.productname::text as category,
      s.barcode::text as sku,
      null::text as region
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
      and (p_channel is null or s.channel = any(p_channel))
  )
  select
    date,
    sum(qty) as qty,
    sum(revenue) as revenue,
    sum(coalesce(spend,0)) as spend,
    case when sum(coalesce(spend,0))>0 then sum(revenue)/sum(spend) else null end as roas,
    avg(tavg) as tavg,
    max(is_event) as is_event
  from f
  group by date
  order by date
$$;

-- analytics.board_roas_by_channel
create or replace function analytics.board_roas_by_channel(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  channel text, revenue numeric, spend numeric, roas numeric
)
language sql stable security definer
as $$
  with f as (
    select
      s.channel::text as channel,
      coalesce(s.revenue,0)::numeric as revenue,
      null::numeric as spend
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
      and (p_channel is null or s.channel = any(p_channel))
  )
  select
    channel,
    sum(revenue) as revenue,
    sum(spend) as spend,
    case when sum(spend)>0 then sum(revenue)/sum(spend) else null end as roas
  from f
  group by channel
  order by sum(revenue) desc
$$;

-- analytics.board_top_categories
create or replace function analytics.board_top_categories(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  category text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  with f as (
    select
      s.productname::text as category,
      coalesce(s.revenue,0)::numeric as revenue,
      coalesce(s.qty,0)::bigint as quantity
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
      and (p_category is null or s.productname = any(p_category))
  ),
  total as (
    select sum(revenue) as total_revenue from f
  )
  select
    f.category,
    sum(f.revenue) as revenue,
    sum(f.quantity) as quantity,
    case when t.total_revenue > 0 then sum(f.revenue) / t.total_revenue * 100 else 0 end as percentage
  from f, total t
  group by f.category, t.total_revenue
  order by sum(f.revenue) desc
$$;

-- analytics.board_top_regions
create or replace function analytics.board_top_regions(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  region text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  with f as (
    select
      '전국'::text as region,
      coalesce(s.revenue,0)::numeric as revenue,
      coalesce(s.qty,0)::bigint as quantity
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
  ),
  total as (
    select sum(revenue) as total_revenue from f
  )
  select
    f.region,
    sum(f.revenue) as revenue,
    sum(f.quantity) as quantity,
    case when t.total_revenue > 0 then sum(f.revenue) / t.total_revenue * 100 else 0 end as percentage
  from f, total t
  group by f.region, t.total_revenue
  order by sum(f.revenue) desc
$$;

-- analytics.board_top_skus
create or replace function analytics.board_top_skus(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  with f as (
    select
      s.barcode::text as sku,
      coalesce(s.revenue,0)::numeric as revenue,
      coalesce(s.qty,0)::bigint as quantity
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
      and (p_sku is null or s.barcode::text = any(p_sku))
  ),
  total as (
    select sum(revenue) as total_revenue from f
  )
  select
    f.sku,
    sum(f.revenue) as revenue,
    sum(f.quantity) as quantity,
    case when t.total_revenue > 0 then sum(f.revenue) / t.total_revenue * 100 else 0 end as percentage
  from f, total t
  group by f.sku, t.total_revenue
  order by sum(f.revenue) desc
$$;

-- analytics.board_abc_by_sku
create or replace function analytics.board_abc_by_sku(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, revenue numeric, quantity bigint, abc_class text, percentage numeric
)
language sql stable security definer
as $$
  with f as (
    select
      s.barcode::text as sku,
      coalesce(s.revenue,0)::numeric as revenue,
      coalesce(s.qty,0)::bigint as quantity
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
      and (p_sku is null or s.barcode::text = any(p_sku))
  ),
  total as (
    select sum(revenue) as total_revenue from f
  ),
  ranked as (
    select
      f.sku,
      sum(f.revenue) as revenue,
      sum(f.quantity) as quantity,
      sum(f.revenue) / t.total_revenue * 100 as percentage,
      sum(sum(f.revenue)) over (order by sum(f.revenue) desc) / t.total_revenue * 100 as cumulative_percentage
    from f, total t
    group by f.sku, t.total_revenue
  )
  select
    sku,
    revenue,
    quantity,
    case 
      when cumulative_percentage <= 80 then 'A'
      when cumulative_percentage <= 95 then 'B'
      else 'C'
    end as abc_class,
    percentage
  from ranked
  order by revenue desc
$$;

-- analytics.board_inventory_analysis
create or replace function analytics.board_inventory_analysis(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, current_stock bigint, reorder_point bigint, suggested_order bigint, days_remaining bigint
)
language sql stable security definer
as $$
  select
    i.sku::text as sku,
    coalesce(i.current_stock, 0)::bigint as current_stock,
    coalesce(i.reorder_point, 0)::bigint as reorder_point,
    greatest(0, coalesce(i.reorder_point, 0) - coalesce(i.current_stock, 0))::bigint as suggested_order,
    case 
      when coalesce(i.current_stock, 0) > 0 then 
        coalesce(i.current_stock, 0) * 30 / greatest(1, coalesce(sales.avg_daily_qty, 1))
      else 0
    end::bigint as days_remaining
  from public.items i
  left join (
    select 
      s.barcode,
      avg(s.qty) as avg_daily_qty
    from public.sales s
    where (p_from is null or s.sale_date >= p_from)
      and (p_to   is null or s.sale_date <= p_to)
    group by s.barcode
  ) sales on i.sku = sales.barcode::text
  where (p_sku is null or i.sku = any(p_sku))
  order by i.sku
$$;

-- B-3. public 래퍼(6-파라미터 + 0-인자) 재생성
create or replace function public.board_sales_daily(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int
)
language sql stable security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_sales_daily()
returns table(
  date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int
)
language sql stable security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(null,null,null,null,null,null)
$$;

create or replace function public.board_roas_by_channel(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  channel text, revenue numeric, spend numeric, roas numeric
)
language sql stable security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_roas_by_channel()
returns table(
  channel text, revenue numeric, spend numeric, roas numeric
)
language sql stable security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(null,null,null,null,null,null)
$$;

create or replace function public.board_top_categories(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  category text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select category, revenue, quantity, percentage
  from analytics.board_top_categories(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_top_categories()
returns table(
  category text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select category, revenue, quantity, percentage
  from analytics.board_top_categories(null,null,null,null,null,null)
$$;

create or replace function public.board_top_regions(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  region text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select region, revenue, quantity, percentage
  from analytics.board_top_regions(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_top_regions()
returns table(
  region text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select region, revenue, quantity, percentage
  from analytics.board_top_regions(null,null,null,null,null,null)
$$;

create or replace function public.board_top_skus(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select sku, revenue, quantity, percentage
  from analytics.board_top_skus(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_top_skus()
returns table(
  sku text, revenue numeric, quantity bigint, percentage numeric
)
language sql stable security definer
as $$
  select sku, revenue, quantity, percentage
  from analytics.board_top_skus(null,null,null,null,null,null)
$$;

create or replace function public.board_abc_by_sku(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, revenue numeric, quantity bigint, abc_class text, percentage numeric
)
language sql stable security definer
as $$
  select sku, revenue, quantity, abc_class, percentage
  from analytics.board_abc_by_sku(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_abc_by_sku()
returns table(
  sku text, revenue numeric, quantity bigint, abc_class text, percentage numeric
)
language sql stable security definer
as $$
  select sku, revenue, quantity, abc_class, percentage
  from analytics.board_abc_by_sku(null,null,null,null,null,null)
$$;

create or replace function public.board_inventory_analysis(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, current_stock bigint, reorder_point bigint, suggested_order bigint, days_remaining bigint
)
language sql stable security definer
as $$
  select sku, current_stock, reorder_point, suggested_order, days_remaining
  from analytics.board_inventory_analysis(
    p_from := p_from, p_to := p_to,
    p_region := p_region, p_channel := p_channel,
    p_category := p_category, p_sku := p_sku
  )
$$;

create or replace function public.board_inventory_analysis()
returns table(
  sku text, current_stock bigint, reorder_point bigint, suggested_order bigint, days_remaining bigint
)
language sql stable security definer
as $$
  select sku, current_stock, reorder_point, suggested_order, days_remaining
  from analytics.board_inventory_analysis(null,null,null,null,null,null)
$$;

-- 권한 부여
grant execute on function public.board_sales_daily() to anon, authenticated;
grant execute on function public.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_roas_by_channel() to anon, authenticated;
grant execute on function public.board_roas_by_channel(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_categories() to anon, authenticated;
grant execute on function public.board_top_categories(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_regions() to anon, authenticated;
grant execute on function public.board_top_regions(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_skus() to anon, authenticated;
grant execute on function public.board_top_skus(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_abc_by_sku() to anon, authenticated;
grant execute on function public.board_abc_by_sku(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_inventory_analysis() to anon, authenticated;
grant execute on function public.board_inventory_analysis(date,date,text[],text[],text[],text[]) to anon, authenticated;

-- C) Realtime & RLS (안정성 점검)
-- 1) publication & replica identity
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;
end $$;

-- 필요한 테이블들 생성
create table if not exists analytics.data_version (
  tenant_id uuid primary key,
  version bigint not null default 1,
  updated_at timestamptz default now()
);

create table if not exists analytics.ingest_jobs (
  tenant_id uuid not null,
  file_id uuid not null,
  status text not null check (status in ('uploading','staging','merging','merged','failed')),
  rows_staged int default 0,
  rows_merged int default 0,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (tenant_id, file_id)
);

alter table analytics.data_version replica identity full;
alter table analytics.ingest_jobs replica identity full;

alter publication supabase_realtime add table analytics.data_version;
alter publication supabase_realtime add table analytics.ingest_jobs;

-- 2) (DEV 옵션) 세션 없이도 구독 폴백 허용
grant select on analytics.data_version, analytics.ingest_jobs to anon;

drop policy if exists dv_sel on analytics.data_version;
create policy dv_sel on analytics.data_version
for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'));

drop policy if exists ij_sel on analytics.ingest_jobs;
create policy ij_sel on analytics.ingest_jobs
for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'));

-- analytics.current_tenant_id 함수 생성
create or replace function analytics.current_tenant_id()
returns uuid
language sql stable
as $$
  select coalesce(
    current_setting('app.tenant_id', true)::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

-- analytics.bump_data_version 함수 생성
create or replace function analytics.bump_data_version(p_tenant_id uuid)
returns bigint
language plpgsql
security definer
as $$
declare
  newv bigint;
begin
  insert into analytics.data_version (tenant_id, version)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do update set
    version = data_version.version + 1,
    updated_at = now()
  returning version into newv;
  return newv;
end;
$$;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
