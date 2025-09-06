-- 인사이트 분석 RPC 함수들
-- 이미 있는 테이블/기능 가정: analytics.fact_sales (tenant_id, sale_date, region, channel, category, sku, qty, revenue, ad_cost, discount_rate, tavg)

-- 1) 일자 집계(재사용)
create or replace view analytics.v_daily as
select tenant_id, sale_date,
       sum(coalesce(qty,0))    as qty,
       sum(coalesce(revenue,0)) as revenue,
       sum(coalesce(ad_cost,0)) as spend,
       avg(nullif(tavg,0))     as tavg
from analytics.fact_sales
group by tenant_id, sale_date;

-- 2) 온도-판매 회귀(탄력도)
create or replace function public.board_reg_qty_tavg(p_tenant_id uuid, p_from date, p_to date)
returns table(slope numeric, intercept numeric, r2 numeric, avg_tavg numeric, avg_qty numeric, elasticity numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select tavg, qty from analytics.v_daily
    where tenant_id = p_tenant_id and sale_date between p_from and p_to and tavg is not null and qty is not null
  )
  select
    regr_slope(qty, tavg)   as slope,
    regr_intercept(qty, tavg) as intercept,
    regr_r2(qty, tavg)      as r2,
    avg(tavg)               as avg_tavg,
    avg(qty)                as avg_qty,
    case when avg(qty)=0 or avg(tavg)=0 then null
         else regr_slope(qty,tavg) * (avg(tavg)/avg(qty)) end as elasticity
  from d;
$$;

-- 3) 광고비-매출 회귀(반응/한계ROAS)
create or replace function public.board_reg_rev_spend(p_tenant_id uuid, p_from date, p_to date)
returns table(slope numeric, intercept numeric, r2 numeric, avg_spend numeric, avg_rev numeric, marginal_roas numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select spend, revenue from analytics.v_daily
    where tenant_id = p_tenant_id and sale_date between p_from and p_to and spend is not null and revenue is not null
  )
  select
    regr_slope(revenue, spend)   as slope,
    regr_intercept(revenue, spend) as intercept,
    regr_r2(revenue, spend)      as r2,
    avg(spend)                   as avg_spend,
    avg(revenue)                 as avg_rev,
    regr_slope(revenue, spend)   as marginal_roas
  from d;
$$;

-- 4) ABC 분석 (SKU)
create or replace function public.board_abc_by_sku(p_tenant_id uuid, p_from date, p_to date)
returns table(sku text, revenue numeric, share numeric, cum_share numeric, grade text)
language sql security definer set search_path=public, analytics as $$
  with s as (
    select sku, sum(coalesce(revenue,0)) as revenue
    from analytics.fact_sales
    where tenant_id=p_tenant_id and sale_date between p_from and p_to and sku is not null
    group by sku
  ),
  tot as (select sum(revenue) as total from s),
  r as (
    select sku, revenue, revenue/(select total from tot) as share
    from s order by revenue desc
  ),
  c as (
    select sku, revenue, share,
           sum(share) over (order by revenue desc rows between unbounded preceding and current row) as cum_share
    from r
  )
  select sku, revenue, share, cum_share,
         case when cum_share <= 0.80 then 'A'
              when cum_share <= 0.95 then 'B'
              else 'C' end as grade
  from c;
$$;

-- 5) 리오더 포인트(ROP) 제안 (리드타임/서비스레벨 입력)
create or replace function public.board_reorder_points(
  p_tenant_id uuid, p_from date, p_to date,
  p_lead_time_days int default 7, p_z numeric default 1.65
) returns table(sku text, avg_daily numeric, std_daily numeric, reorder_point numeric)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select sku, sale_date, sum(coalesce(qty,0)) as qty
    from analytics.fact_sales
    where tenant_id=p_tenant_id and sale_date between p_from and p_to and sku is not null
    group by sku, sale_date
  ),
  stat as (
    select sku, avg(qty) as avg_daily, stddev_samp(qty) as std_daily
    from d group by sku
  )
  select sku, avg_daily, std_daily,
         (avg_daily * p_lead_time_days) + (coalesce(std_daily,0) * sqrt(p_lead_time_days) * p_z) as reorder_point
  from stat;
$$;

-- 6) 단종(EOL) 후보: 최근 무판매/하락 추세
create or replace function public.board_eol_candidates(
  p_tenant_id uuid, p_ref date default current_date, p_lookback int default 60
) returns table(sku text, last_sale date, days_since int, qty_30d numeric, slope_60d numeric)
language sql security definer set search_path=public, analytics as $$
  with base as (
    select sku, sale_date, sum(coalesce(qty,0)) qty
    from analytics.fact_sales
    where tenant_id=p_tenant_id and sale_date >= p_ref - (p_lookback||' days')::interval
      and sku is not null
    group by sku, sale_date
  ),
  last_s as (
    select sku, max(sale_date) as last_sale from base group by sku
  ),
  s60 as (
    select sku,
           regr_slope(qty, extract(epoch from sale_date)::bigint) as slope_60d
    from base group by sku
  ),
  q30 as (
    select sku, sum(qty) filter (where sale_date >= p_ref - interval '30 days') as qty_30d
    from base group by sku
  )
  select l.sku,
         l.last_sale,
         (p_ref - l.last_sale)::int as days_since,
         coalesce(q.qty_30d,0) as qty_30d,
         s.slope_60d
  from last_s l
  left join q30 q using (sku)
  left join s60 s using (sku)
  where (p_ref - l.last_sale) >= 30  -- 30일 이상 무판매
     or (coalesce(q.qty_30d,0)=0)    -- 최근 30일 판매 0
     or (s.slope_60d < 0);           -- 하락 추세
$$;

-- 7) Top movers: 최근 7일 vs 30일
create or replace function public.board_top_movers(p_tenant_id uuid, p_to date, p_window int default 7, p_base int default 30)
returns table(sku text, avg_win numeric, avg_base numeric, zscore numeric, direction text)
language sql security definer set search_path=public, analytics as $$
  with d as (
    select sku, sale_date, sum(coalesce(qty,0)) qty
    from analytics.fact_sales
    where tenant_id=p_tenant_id and sale_date > p_to - interval '40 days' and sku is not null
    group by sku, sale_date
  ),
  win as (select sku, avg(qty) as avg_win from d where sale_date > p_to - (p_window||' days')::interval group by sku),
  base as (select sku, avg(qty) as avg_base, stddev_samp(qty) as sd_base from d where sale_date > p_to - (p_base||' days')::interval group by sku)
  select w.sku, w.avg_win, b.avg_base,
         case when b.sd_base is null or b.sd_base=0 then null else (w.avg_win - b.avg_base)/b.sd_base end as zscore,
         case when (w.avg_win - b.avg_base) >= 0 then 'up' else 'down' end as direction
  from win w join base b using (sku);
$$;

-- 권한 부여
grant execute on function
  public.board_reg_qty_tavg(uuid,date,date),
  public.board_reg_rev_spend(uuid,date,date),
  public.board_abc_by_sku(uuid,date,date),
  public.board_reorder_points(uuid,date,date,int,numeric),
  public.board_eol_candidates(uuid,date,int),
  public.board_top_movers(uuid,date,int,int)
to anon, authenticated, service_role;
