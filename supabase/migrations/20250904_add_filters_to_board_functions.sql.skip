-- Add filter support to board functions
-- This migration adds optional filter parameters to existing board functions

-- 1) Update sales daily function to support filters
-- 기존 함수 삭제
drop function if exists public.board_sales_daily(uuid, date, date);
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text);
create or replace function public.board_sales_daily(
  p_tenant_id uuid, 
  p_from date, 
  p_to date,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(sale_date date, qty numeric, revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  select sale_date, sum(coalesce(qty,0)), sum(coalesce(revenue,0)) 
  from analytics.fact_sales
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
    and (p_sku is null or sku = p_sku)
  group by sale_date 
  order by sale_date
$$;

-- 2) Update ROAS by channel function
create or replace function public.board_roas_by_channel(
  p_tenant_id uuid, 
  p_from date, 
  p_to date,
  p_region text default null,
  p_category text default null,
  p_sku text default null
)
returns table(channel text, avg_roas numeric) 
language sql security definer set search_path=public, analytics as $$
  with channel_totals as (
    select channel, sum(coalesce(revenue,0)) as total_revenue, sum(coalesce(ad_cost,0)) as total_ad_cost
    from analytics.fact_sales
    where tenant_id=p_tenant_id 
      and sale_date between p_from and p_to
      and (p_region is null or region = p_region)
      and (p_category is null or category = p_category)
      and (p_sku is null or sku = p_sku)
    group by channel
  )
  select channel, 
         case when total_ad_cost = 0 then null else total_revenue / nullif(total_ad_cost, 0) end as avg_roas
  from channel_totals
$$;

-- 3) Update top categories function
create or replace function public.board_top_categories(
  p_tenant_id uuid, 
  p_from date, 
  p_to date, 
  p_limit int default 10,
  p_region text default null,
  p_channel text default null,
  p_sku text default null
)
returns table(category text, revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  select coalesce(category,'(미지정)'), sum(coalesce(revenue,0))
  from analytics.fact_sales 
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_sku is null or sku = p_sku)
  group by 1 
  order by 2 desc 
  limit p_limit
$$;

-- 4) Update top regions function
create or replace function public.board_top_regions(
  p_tenant_id uuid, 
  p_from date, 
  p_to date, 
  p_limit int default 10,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(region text, revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  select coalesce(region,'(미지정)'), sum(coalesce(revenue,0))
  from analytics.fact_sales 
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
    and (p_sku is null or sku = p_sku)
  group by 1 
  order by 2 desc 
  limit p_limit
$$;

-- 5) Update top SKUs function
create or replace function public.board_top_skus(
  p_tenant_id uuid, 
  p_from date, 
  p_to date, 
  p_limit int default 10,
  p_region text default null,
  p_channel text default null,
  p_category text default null
)
returns table(sku text, revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  select sku, sum(coalesce(revenue,0))
  from analytics.fact_sales 
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to 
    and sku is not null
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
  group by 1 
  order by 2 desc 
  limit p_limit
$$;

-- 6) Update cumulative revenue function
create or replace function public.board_cumulative_revenue(
  p_tenant_id uuid, 
  p_from date, 
  p_to date,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(sale_date date, cum_revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  with d as (
    select sale_date, sum(coalesce(revenue,0)) rev
    from analytics.fact_sales 
    where tenant_id=p_tenant_id 
      and sale_date between p_from and p_to
      and (p_region is null or region = p_region)
      and (p_channel is null or channel = p_channel)
      and (p_category is null or category = p_category)
      and (p_sku is null or sku = p_sku)
    group by sale_date
  )
  select sale_date,
         sum(rev) over (order by sale_date rows between unbounded preceding and current row)
  from d 
  order by sale_date
$$;

-- 7) Update temperature vs sales function
create or replace function public.board_temp_vs_sales(
  p_tenant_id uuid, 
  p_from date, 
  p_to date,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(sale_date date, tavg numeric, qty numeric, revenue numeric)
language sql security definer set search_path=public, analytics as $$
  select sale_date, avg(nullif(tavg,0)) as tavg,
         sum(coalesce(qty,0)) as qty, sum(coalesce(revenue,0)) as revenue
  from analytics.fact_sales
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
    and (p_sku is null or sku = p_sku)
  group by sale_date 
  order by sale_date
$$;

-- 8) Update spend vs revenue daily function
create or replace function public.board_spend_rev_daily(
  p_tenant_id uuid, 
  p_from date, 
  p_to date,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(sale_date date, spend numeric, revenue numeric)
language sql security definer set search_path=public, analytics as $$
  select sale_date, sum(coalesce(ad_cost,0)) as spend, sum(coalesce(revenue,0)) as revenue
  from analytics.fact_sales
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
    and (p_sku is null or sku = p_sku)
  group by sale_date 
  order by sale_date
$$;

-- Update grants for new function signatures
grant execute on function
  public.board_sales_daily(uuid,date,date,text,text,text,text),
  public.board_roas_by_channel(uuid,date,date,text,text,text),
  public.board_top_categories(uuid,date,date,int,text,text,text),
  public.board_top_regions(uuid,date,date,int,text,text,text),
  public.board_top_skus(uuid,date,date,int,text,text,text),
  public.board_cumulative_revenue(uuid,date,date,text,text,text,text),
  public.board_temp_vs_sales(uuid,date,date,text,text,text,text),
  public.board_spend_rev_daily(uuid,date,date,text,text,text,text)
to anon, authenticated, service_role;
