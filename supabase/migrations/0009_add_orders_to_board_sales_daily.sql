-- 0009_add_orders_to_board_sales_daily.sql
-- board_sales_daily 함수에 orders 필드 추가

set role postgres;

-- 기존 함수 삭제
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text);

-- 새 함수 생성 (orders 포함)
create or replace function public.board_sales_daily(
  p_tenant_id uuid,
  p_from      date default null,
  p_to        date default null,
  p_region    text default null,
  p_channel   text default null,
  p_category  text default null,
  p_sku       text default null
)
returns table (
  sale_date date,
  qty       numeric,
  revenue   numeric,
  orders    numeric
)
language sql 
security definer 
set search_path=public, analytics 
as $$
  select
    f.sale_date,
    sum(coalesce(f.qty, 0))                         as qty,
    sum(coalesce(f.revenue, 0))                     as revenue,
    count(distinct f.sku)                           as orders
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and (p_from    is null or f.sale_date    >= p_from)
    and (p_to      is null or f.sale_date    <= p_to)
    and (p_region  is null or f.region       = p_region)
    and (p_channel is null or f.channel      = p_channel)
    and (p_category is null or f.category    = p_category)
    and (p_sku     is null or f.sku          = p_sku)
  group by f.sale_date
  order by f.sale_date;
$$;

-- 권한 부여
grant execute on function public.board_sales_daily(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;
