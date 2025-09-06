create schema if not exists analytics;

create or replace function public.board_get_kpis(
  p_tenant_id uuid,
  p_from date,
  p_to   date
) returns table(
  rows_count bigint,
  revenue numeric,
  ad_cost numeric,
  roas numeric,
  match_rate numeric,
  missing_ratio numeric
) language sql stable security definer set search_path = public, analytics as $$
  with src as (
    select
      sale_date, channel, region, category, sku,
      coalesce(revenue, 0)::numeric as revenue,
      coalesce(ad_cost, 0)::numeric as ad_cost
    from analytics.fact_sales
    where tenant_id = p_tenant_id
      and sale_date >= p_from and sale_date <= p_to
  ),
  base as (
    select
      count(*)::bigint as rows_count,
      sum(revenue)::numeric as revenue,
      sum(ad_cost)::numeric as ad_cost
    from src
  ),
  dq as (
    select
      (sum(case when nullif(trim(coalesce(sku,'')), '') is null then 1 else 0 end)::numeric
       / greatest(count(*),1)) as missing_ratio
    from src
  )
  select
    base.rows_count,
    coalesce(base.revenue,0) as revenue,
    coalesce(base.ad_cost,0) as ad_cost,
    case when coalesce(base.ad_cost,0) > 0 then coalesce(base.revenue,0)/base.ad_cost else null end as roas,
    null::numeric as match_rate, -- TODO: replace with real logic later
    coalesce(dq.missing_ratio,0) as missing_ratio
  from base, dq;
$$;

create or replace function public.board_sales_daily(
  p_tenant_id uuid,
  p_from date,
  p_to   date
) returns table(
  sale_date date,
  revenue numeric
) language sql stable security definer set search_path = public, analytics as $$
  with src as (
    select sale_date, coalesce(revenue,0)::numeric as revenue
    from analytics.fact_sales
    where tenant_id = p_tenant_id
      and sale_date >= p_from and sale_date <= p_to
  )
  select sale_date, sum(revenue) as revenue
  from src
  group by 1
  order by 1;
$$;

create or replace function public.board_roas_by_channel(
  p_tenant_id uuid,
  p_from date,
  p_to   date
) returns table(
  channel text,
  avg_roas numeric
) language sql stable security definer set search_path = public, analytics as $$
  with src as (
    select channel,
           coalesce(revenue,0)::numeric as revenue,
           coalesce(ad_cost,0)::numeric as ad_cost
    from analytics.fact_sales
    where tenant_id = p_tenant_id
      and sale_date >= p_from and sale_date <= p_to
      and nullif(trim(coalesce(channel,'')),'') is not null
  )
  select channel,
         case when sum(ad_cost) > 0 then sum(revenue)/sum(ad_cost) else null end as avg_roas
  from src
  group by 1
  order by 1;
$$;

grant execute on function public.board_get_kpis(uuid,date,date) to anon, authenticated, service_role;
grant execute on function public.board_sales_daily(uuid,date,date) to anon, authenticated, service_role;
grant execute on function public.board_roas_by_channel(uuid,date,date) to anon, authenticated, service_role;
