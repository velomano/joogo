-- 누락된 RPC 함수들 생성

-- 1) ABC 분석 함수 (매출 누적 비율로 A/B/C)
create or replace function public.board_abc_by_sku(
  p_tenant_id uuid,
  p_from      date default null,
  p_to        date default null,
  p_limit     int  default 100
)
returns table (
  sku      text,
  qty      numeric,
  revenue  numeric,
  abc      text
)
language sql
security definer
set search_path = public, analytics
as $$
  with base as (
    select f.sku,
           sum(coalesce(f.qty, 0)) as qty,
           sum(coalesce(f.revenue, 0)) as revenue
    from analytics.fact_sales f
    where f.tenant_id = p_tenant_id
      and (p_from is null or f.sale_date >= p_from)
      and (p_to   is null or f.sale_date <= p_to)
    group by f.sku
  ),
  ranked as (
    select *,
           sum(revenue) over () as total_rev,
           sum(revenue) over (order by revenue desc
                              rows between unbounded preceding and current row) as cum_rev
    from base
  )
  select sku, qty, revenue,
         case
           when total_rev = 0 then 'C'
           when cum_rev / nullif(total_rev,0) <= 0.80 then 'A'
           when cum_rev / nullif(total_rev,0) <= 0.95 then 'B'
           else 'C'
         end as abc
  from ranked
  order by revenue desc
  limit p_limit;
$$;

-- 2) 재고 재주문점 함수
create or replace function public.board_reorder_points(
  p_tenant_id     uuid,
  p_from          date default null,
  p_to            date default null,
  p_lead_time_days int  default 7
)
returns table (
  sku             text,
  daily_demand    numeric,
  safety_stock    numeric,
  reorder_point   numeric
)
language sql
security definer
set search_path = public, analytics
as $$
  with period as (
    select coalesce(p_from, current_date - interval '30 days')::date as d_from,
           coalesce(p_to,   current_date)::date as d_to
  ),
  stats as (
    select f.sku,
           sum(coalesce(f.qty,0)) as total_qty,
           (select (d_to - d_from) + 1 from period) as days
    from analytics.fact_sales f, period
    where f.tenant_id = p_tenant_id
      and f.sale_date between (select d_from from period) and (select d_to from period)
    group by f.sku
  )
  select
    s.sku,
    (s.total_qty / nullif(s.days,0))::numeric as daily_demand,
    0::numeric as safety_stock, -- 필요시 표준편차 기반으로 보완
    ((s.total_qty / nullif(s.days,0)) * p_lead_time_days)::numeric as reorder_point
  from stats s
  where s.total_qty > 0;
$$;

-- 3) EOL 후보 함수 (최근 X일간 판매 없음)
create or replace function public.board_eol_candidates(
  p_tenant_id   uuid,
  p_cutoff_days int default 90
)
returns table (
  sku               text,
  last_sale_date    date,
  days_since_last   int
)
language sql
security definer
set search_path = public, analytics
as $$
  with last_sale as (
    select f.sku, max(f.sale_date) as last_sale_date
    from analytics.fact_sales f
    where f.tenant_id = p_tenant_id
    group by f.sku
  )
  select
    l.sku,
    l.last_sale_date,
    (current_date - l.last_sale_date) as days_since_last
  from last_sale l
  where (current_date - l.last_sale_date) >= p_cutoff_days
  order by l.last_sale_date asc;
$$;

-- 4) PostgREST 스키마 캐시 리로드 함수
create or replace function public.pgrst_reload_schema()
returns void
language sql
security definer
as $$
  select pg_notify('pgrst', 'reload schema');
$$;

-- 권한 부여
grant execute on function public.board_abc_by_sku(uuid, date, date, int)
  to anon, authenticated, service_role;

grant execute on function public.board_reorder_points(uuid, date, date, int)
  to anon, authenticated, service_role;

grant execute on function public.board_eol_candidates(uuid, int)
  to anon, authenticated, service_role;

grant execute on function public.pgrst_reload_schema()
  to service_role, authenticated;

-- 스키마 캐시 리로드
select public.pgrst_reload_schema();
