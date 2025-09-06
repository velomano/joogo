-- === 추가 BOARD RPC 함수들 ===

-- helpers: safe division
create or replace function public._safe_div(n numeric, d numeric)
returns numeric language sql immutable as $$
  select case when d is null or d = 0 then null else n/d end
$$;

-- 1) 일자별 매출
create or replace function public.board_sales_daily(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, revenue numeric)
language sql security definer set search_path = public, analytics
as $$
  select f.sale_date, sum(coalesce(f.revenue,0)) as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and f.sale_date between p_from and p_to
  group by f.sale_date
  order by f.sale_date
$$;

-- 2) 채널별 ROAS(평균)
create or replace function public.board_roas_by_channel(p_tenant_id uuid, p_from date, p_to date)
returns table(channel text, avg_roas numeric)
language sql security definer set search_path = public, analytics
as $$
  select coalesce(f.channel,'(미지정)') as channel,
         avg(public._safe_div(f.revenue, nullif(f.ad_cost,0))) as avg_roas
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and f.sale_date between p_from and p_to
  group by 1
  order by 2 desc nulls last
$$;

-- 3) TOP 카테고리 (매출)
create or replace function public.board_top_categories(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(category text, revenue numeric)
language sql security definer set search_path = public, analytics
as $$
  select coalesce(f.category,'(미지정)') as category,
         sum(coalesce(f.revenue,0)) as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and f.sale_date between p_from and p_to
  group by 1
  order by 2 desc
  limit p_limit
$$;

-- 4) TOP 지역 (매출)
create or replace function public.board_top_regions(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(region text, revenue numeric)
language sql security definer set search_path = public, analytics
as $$
  select coalesce(f.region,'(미지정)') as region,
         sum(coalesce(f.revenue,0)) as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and f.sale_date between p_from and p_to
  group by 1
  order by 2 desc
  limit p_limit
$$;

-- 5) TOP SKU (매출)
create or replace function public.board_top_skus(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(sku text, revenue numeric)
language sql security definer set search_path = public, analytics
as $$
  select coalesce(f.sku,'(미지정)') as sku,
         sum(coalesce(f.revenue,0)) as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and f.sale_date between p_from and p_to
  group by 1
  order by 2 desc
  limit p_limit
$$;

-- 6) 누적 매출
create or replace function public.board_cumulative_revenue(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, cum_revenue numeric)
language sql security definer set search_path = public, analytics
as $$
  with daily as (
    select f.sale_date, sum(coalesce(f.revenue,0)) as revenue
    from analytics.fact_sales f
    where f.tenant_id = p_tenant_id
      and f.sale_date between p_from and p_to
    group by f.sale_date
  )
  select d.sale_date,
         sum(d.revenue) over (order by d.sale_date rows between unbounded preceding and current row) as cum_revenue
  from daily d
  order by d.sale_date
$$;

-- indexes to help (idempotent)
create index if not exists ix_fact_sales_tenant_category_date on analytics.fact_sales(tenant_id, category, sale_date);
create index if not exists ix_fact_sales_tenant_region_date   on analytics.fact_sales(tenant_id, region, sale_date);
create index if not exists ix_fact_sales_tenant_sku_date      on analytics.fact_sales(tenant_id, sku, sale_date);

-- 권한 부여
grant execute on function
  public.board_sales_daily(uuid,date,date),
  public.board_roas_by_channel(uuid,date,date),
  public.board_top_categories(uuid,date,date,int),
  public.board_top_regions(uuid,date,date,int),
  public.board_top_skus(uuid,date,date,int),
  public.board_cumulative_revenue(uuid,date,date)
to anon, authenticated, service_role;
