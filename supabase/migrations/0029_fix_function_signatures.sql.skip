-- 13단계: 함수 시그니처 확인 및 수정

-- 1. 현재 함수들 확인
SELECT 
  routine_schema, 
  routine_name, 
  specific_name,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema IN ('analytics', 'public')
  AND routine_name LIKE 'board_%'
ORDER BY routine_schema, routine_name, specific_name;

-- 2. 클라이언트가 호출하는 시그니처에 맞게 함수 생성
-- 클라이언트: public.board_sales_daily(p_category, p_channel, p_from, p_region, p_sku, p_to)

-- analytics 함수 (올바른 순서)
create or replace function analytics.board_sales_daily(
  p_from date,
  p_to date,
  p_region text[],
  p_channel text[],
  p_category text[],
  p_sku text[]
)
returns table (
  date date,
  qty numeric,
  revenue numeric,
  spend numeric,
  roas numeric,
  tavg numeric,
  is_event int
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.sale_date as date,
    sum(fs.quantity) as qty,
    sum(fs.revenue) as revenue,
    sum(fs.spend) as spend,
    case 
      when sum(fs.spend) > 0 then sum(fs.revenue) / sum(fs.spend)
      else 0
    end as roas,
    avg(fs.revenue) as tavg,
    case when count(*) > 0 then 1 else 0 end as is_event
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.sale_date
  order by fs.sale_date;
end;
$$;

-- public 래퍼 (클라이언트 호출 순서에 맞게)
create or replace function public.board_sales_daily(
  p_category text[] default null,
  p_channel text[] default null,
  p_from date default null,
  p_region text[] default null,
  p_sku text[] default null,
  p_to date default null
)
returns table (
  date date,
  qty numeric,
  revenue numeric,
  spend numeric,
  roas numeric,
  tavg numeric,
  is_event int
)
language sql stable security definer as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

-- 0-인자 폴백
create or replace function public.board_sales_daily()
returns table (
  date date,
  qty numeric,
  revenue numeric,
  spend numeric,
  roas numeric,
  tavg numeric,
  is_event int
)
language sql stable security definer as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(null, null, null, null, null, null)
$$;

-- 권한 부여
grant execute on function analytics.board_sales_daily(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_sales_daily() to anon, authenticated;
grant execute on function public.board_sales_daily(text[], text[], date, text[], text[], date) to anon, authenticated;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
