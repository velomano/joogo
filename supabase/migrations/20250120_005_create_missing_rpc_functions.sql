-- 1) ABC 분석
create or replace function public.board_abc_by_sku(
  p_tenant_id uuid,
  p_from      date default null,
  p_to        date default null,
  p_limit     int  default 100
)
returns table (sku text, qty numeric, revenue numeric, abc text)
language sql security definer set search_path=public, analytics as $$
  with base as (
    select f.sku,
           sum(coalesce(f.qty,0)) qty,
           sum(coalesce(f.revenue,0)) revenue
    from analytics.fact_sales f
    where f.tenant_id = p_tenant_id
      and (p_from is null or f.sale_date >= p_from)
      and (p_to   is null or f.sale_date <= p_to)
    group by f.sku
  ),
  ranked as (
    select *,
           sum(revenue) over () total_rev,
           sum(revenue) over (order by revenue desc
                              rows between unbounded preceding and current row) cum_rev
    from base
  )
  select sku, qty, revenue,
         case when total_rev=0 then 'C'
              when cum_rev/nullif(total_rev,0) <= 0.80 then 'A'
              when cum_rev/nullif(total_rev,0) <= 0.95 then 'B'
              else 'C' end as abc
  from ranked
  order by revenue desc
  limit p_limit;
$$;
grant execute on function public.board_abc_by_sku(uuid,date,date,int)
  to anon, authenticated, service_role;

-- 2) 재주문점
create or replace function public.board_reorder_points(
  p_tenant_id      uuid,
  p_from           date default null,
  p_to             date default null,
  p_lead_time_days int  default 7
)
returns table (sku text, daily_demand numeric, safety_stock numeric, reorder_point numeric)
language sql security definer set search_path=public, analytics as $$
  with period as (
    select coalesce(p_from, current_date - interval '30 days')::date d_from,
           coalesce(p_to,   current_date)::date d_to
  ),
  stats as (
    select f.sku,
           sum(coalesce(f.qty,0)) total_qty,
           (select (d_to - d_from) + 1 from period) days
    from analytics.fact_sales f, period
    where f.tenant_id = p_tenant_id
      and f.sale_date between (select d_from from period) and (select d_to from period)
    group by f.sku
  )
  select sku,
         (total_qty/nullif(days,0))::numeric             as daily_demand,
         0::numeric                                      as safety_stock,
         ((total_qty/nullif(days,0))*p_lead_time_days)::numeric as reorder_point
  from stats
  where total_qty>0;
$$;
grant execute on function public.board_reorder_points(uuid,date,date,int)
  to anon, authenticated, service_role;

-- 3) EOL 후보
create or replace function public.board_eol_candidates(
  p_tenant_id   uuid,
  p_cutoff_days int default 90
)
returns table (sku text, last_sale_date date, days_since_last int)
language sql security definer set search_path=public, analytics as $$
  with last_sale as (
    select f.sku, max(f.sale_date) last_sale_date
    from analytics.fact_sales f
    where f.tenant_id = p_tenant_id
    group by f.sku
  )
  select sku, last_sale_date,
         (current_date - last_sale_date)::int as days_since_last
  from last_sale
  where (current_date - last_sale_date) >= p_cutoff_days
  order by last_sale_date asc;
$$;
grant execute on function public.board_eol_candidates(uuid,int)
  to anon, authenticated, service_role;

-- PostgREST 캐시 갱신
select pg_notify('pgrst','reload schema');
