-- Drop existing functions first to avoid type conflicts
drop function if exists public.board_temp_vs_sales(uuid,date,date);
drop function if exists public.board_sales_daily(uuid,date,date);
drop function if exists public.board_roas_by_channel(uuid,date,date);
drop function if exists public.board_top_categories(uuid,date,date,int);
drop function if exists public.board_top_regions(uuid,date,date,int);
drop function if exists public.board_top_skus(uuid,date,date,int);
drop function if exists public.board_cumulative_revenue(uuid,date,date);
drop function if exists public.board_spend_rev_daily(uuid,date,date);
drop function if exists public.board_reg_qty_tavg(uuid,date,date);
drop function if exists public.board_reg_rev_spend(uuid,date,date);
drop function if exists public.board_abc_by_sku(uuid,date,date);
drop function if exists public.board_reorder_points(uuid,date,date,int,numeric);
drop function if exists public.board_eol_candidates(uuid,date,int);
drop function if exists public.board_top_movers(uuid,date,int,int);

-- DAILY VIEW (re-usable)
create or replace view analytics.v_daily as
select tenant_id, sale_date,
       sum(coalesce(qty,0))       as qty,
       sum(coalesce(revenue,0))   as revenue,
       sum(coalesce(spend,0))     as spend,
       avg(nullif(tavg,0))        as tavg
from analytics.fact_sales
group by tenant_id, sale_date;

-- 1) sales daily (kept for backward-compat)
create or replace function public.board_sales_daily(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, revenue numeric) language sql security definer set search_path=public, analytics as $$
  select sale_date, sum(coalesce(revenue,0)) from analytics.fact_sales
  where tenant_id=p_tenant_id and sale_date between p_from and p_to
  group by sale_date order by sale_date
$$;

-- 2) ROAS by channel
create or replace function public.board_roas_by_channel(p_tenant_id uuid, p_from date, p_to date)
returns table(channel text, avg_roas numeric) language sql security definer set search_path=public, analytics as $$
  with channel_totals as (
    select channel, sum(coalesce(revenue,0)) as total_revenue, sum(coalesce(spend,0)) as total_ad_cost
    from analytics.fact_sales
    where tenant_id=p_tenant_id and sale_date between p_from and p_to
    group by channel
  )
  select channel, 
         case when total_ad_cost = 0 then null else total_revenue / nullif(total_ad_cost, 0) end as avg_roas
  from channel_totals
$$;

-- 3) TOPs
create or replace function public.board_top_categories(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(category text, revenue numeric) language sql security definer set search_path=public, analytics as $$
  select coalesce(category,'(미지정)'), sum(coalesce(revenue,0))
  from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to
  group by 1 order by 2 desc limit p_limit
$$;

create or replace function public.board_top_regions(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(region text, revenue numeric) language sql security definer set search_path=public, analytics as $$
  select coalesce(region,'(미지정)'), sum(coalesce(revenue,0))
  from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to
  group by 1 order by 2 desc limit p_limit
$$;

create or replace function public.board_top_skus(p_tenant_id uuid, p_from date, p_to date, p_limit int default 10)
returns table(sku text, revenue numeric) language sql security definer set search_path=public, analytics as $$
  select sku, sum(coalesce(revenue,0))
  from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to and sku is not null
  group by 1 order by 2 desc limit p_limit
$$;

-- 4) Cumulative revenue
create or replace function public.board_cumulative_revenue(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, cum_revenue numeric) language sql security definer set search_path=public, analytics as $$
  with d as (
    select sale_date, sum(coalesce(revenue,0)) rev
    from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to
    group by sale_date
  )
  select sale_date,
         sum(rev) over (order by sale_date rows between unbounded preceding and current row)
  from d order by sale_date
$$;

-- 5) Temperature vs Sales (both qty and revenue)
create or replace function public.board_temp_vs_sales(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, tavg numeric, qty numeric, revenue numeric)
language sql security definer set search_path=public, analytics as $$
  select sale_date, avg(nullif(tavg,0)) as tavg,
         sum(coalesce(qty,0)) as qty, sum(coalesce(revenue,0)) as revenue
  from analytics.fact_sales
  where tenant_id=p_tenant_id and sale_date between p_from and p_to
  group by sale_date order by sale_date
$$;

-- 6) Spend vs Revenue daily (for scatter)
create or replace function public.board_spend_rev_daily(p_tenant_id uuid, p_from date, p_to date)
returns table(sale_date date, spend numeric, revenue numeric)
language sql security definer set search_path=public, analytics as $$
  select sale_date, sum(coalesce(spend,0)) as spend, sum(coalesce(revenue,0)) as revenue
  from analytics.fact_sales
  where tenant_id=p_tenant_id and sale_date between p_from and p_to
  group by sale_date order by sale_date
$$;

-- 7) Regressions & insights
create or replace function public.board_reg_qty_tavg(p_tenant_id uuid, p_from date, p_to date)
returns table(slope numeric, intercept numeric, r2 numeric, avg_tavg numeric, avg_qty numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (select tavg, qty from analytics.v_daily where tenant_id=p_tenant_id and sale_date between p_from and p_to and tavg is not null and qty is not null)
  select regr_slope(qty,tavg), regr_intercept(qty,tavg), regr_r2(qty,tavg), avg(tavg), avg(qty) from d
$$;

create or replace function public.board_reg_rev_spend(p_tenant_id uuid, p_from date, p_to date)
returns table(slope numeric, intercept numeric, r2 numeric, avg_spend numeric, avg_rev numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (select spend, revenue from analytics.v_daily where tenant_id=p_tenant_id and sale_date between p_from and p_to and spend is not null and revenue is not null)
  select regr_slope(revenue,spend), regr_intercept(revenue,spend), regr_r2(revenue,spend), avg(spend), avg(revenue) from d
$$;

-- 8) ABC, Reorder point, EOL, Movers
create or replace function public.board_abc_by_sku(p_tenant_id uuid, p_from date, p_to date)
returns table(sku text, revenue numeric, share numeric, cum_share numeric, grade text)
language sql security definer set search_path=public, analytics as $$
  with s as (
    select sku, sum(coalesce(revenue,0)) revenue
    from analytics.fact_sales 
    where tenant_id=p_tenant_id 
      and sale_date between p_from and p_to 
      and sku is not null 
      and sku != ''
    group by sku
  ), 
  tot as (select sum(revenue) t from s),
  r as (
    select sku, revenue, 
           case when (select t from tot) > 0 then revenue/(select t from tot) else 0 end as share 
    from s 
    order by revenue desc
  ),
  c as (
    select sku, revenue, share, 
           sum(share) over (order by revenue desc) cum_share 
    from r
  )
  select sku, revenue, share, cum_share,
         case 
           when cum_share <= 0.80 then 'A' 
           when cum_share <= 0.95 then 'B' 
           else 'C' 
         end as grade
  from c
  where revenue > 0
$$;

create or replace function public.board_reorder_points(p_tenant_id uuid, p_from date, p_to date, p_lead_time_days int default 7, p_z numeric default 1.65)
returns table(sku text, avg_daily numeric, std_daily numeric, reorder_point numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select sku, sale_date, sum(coalesce(qty,0)) qty
    from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to and sku is not null
    group by sku, sale_date
  ), stat as (select sku, avg(qty) avg_daily, stddev_samp(qty) std_daily from d group by sku)
  select sku, avg_daily, std_daily, (avg_daily*p_lead_time_days) + (coalesce(std_daily,0)*sqrt(p_lead_time_days)*p_z) as reorder_point
  from stat
$$;

create or replace function public.board_eol_candidates(p_tenant_id uuid, p_ref date default current_date, p_lookback int default 60)
returns table(sku text, last_sale date, days_since int)
language sql security definer set search_path=public, analytics as $$
  with base as (
    select sku, sale_date, sum(coalesce(qty,0)) qty
    from analytics.fact_sales where tenant_id=p_tenant_id and sale_date>=p_ref-(p_lookback||' days')::interval and sku is not null
    group by sku, sale_date
  ), last_s as (select sku, max(sale_date) last_sale from base group by sku)
  select sku, last_sale, (p_ref - last_sale)::int as days_since from last_s where (p_ref - last_sale) >= 30
$$;

create or replace function public.board_top_movers(p_tenant_id uuid, p_to date, p_window int default 7, p_base int default 30)
returns table(sku text, avg_win numeric, avg_base numeric, zscore numeric, direction text)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select sku, sale_date, sum(coalesce(qty,0)) qty
    from analytics.fact_sales where tenant_id=p_tenant_id and sale_date>p_to - interval '40 days' and sku is not null
    group by sku, sale_date
  ), win as (select sku, avg(qty) avg_win from d where sale_date>p_to-(p_window||' days')::interval group by sku),
     base as (select sku, avg(qty) avg_base, stddev_samp(qty) sd_base from d where sale_date>p_to-(p_base||' days')::interval group by sku)
  select w.sku, w.avg_win, b.avg_base,
         case when b.sd_base is null or b.sd_base=0 then null else (w.avg_win-b.avg_base)/b.sd_base end as zscore,
         case when (w.avg_win-b.avg_base)>=0 then 'up' else 'down' end as direction
  from win w join base b using (sku)
$$;

grant execute on function
  public.board_sales_daily(uuid,date,date),
  public.board_roas_by_channel(uuid,date,date),
  public.board_top_categories(uuid,date,date,int),
  public.board_top_regions(uuid,date,date,int),
  public.board_top_skus(uuid,date,date,int),
  public.board_cumulative_revenue(uuid,date,date),
  public.board_temp_vs_sales(uuid,date,date),
  public.board_spend_rev_daily(uuid,date,date),
  public.board_reg_qty_tavg(uuid,date,date),
  public.board_reg_rev_spend(uuid,date,date),
  public.board_abc_by_sku(uuid,date,date),
  public.board_reorder_points(uuid,date,date,int,numeric),
  public.board_eol_candidates(uuid,date,int),
  public.board_top_movers(uuid,date,int,int)
to anon, authenticated, service_role;

-- helper indexes (no-op if already exist)
create index if not exists ix_fact_sales_tenant_date on analytics.fact_sales(tenant_id, sale_date);
create index if not exists ix_fact_sales_tenant_sku_date on analytics.fact_sales(tenant_id, sku, sale_date);
create index if not exists ix_fact_sales_tenant_channel_date on analytics.fact_sales(tenant_id, channel, sale_date);
create index if not exists ix_fact_sales_tenant_category_date on analytics.fact_sales(tenant_id, category, sale_date);
