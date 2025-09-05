-- 14단계: 실제 테이블 구조에 맞게 함수 수정

-- 1. 먼저 실제 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'analytics' 
  AND table_name = 'fact_sales'
ORDER BY ordinal_position;

-- 2. spend 컬럼이 없으므로 0으로 처리하거나 제거
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
    0::numeric as spend,  -- spend 컬럼이 없으므로 0으로 처리
    0::numeric as roas,   -- spend가 0이므로 roas도 0
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

create or replace function analytics.board_roas_by_channel(
  p_from date,
  p_to date,
  p_region text[],
  p_channel text[],
  p_category text[],
  p_sku text[]
)
returns table (
  channel text,
  revenue numeric,
  spend numeric,
  roas numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.channel,
    sum(fs.revenue) as revenue,
    0::numeric as spend,  -- spend 컬럼이 없으므로 0으로 처리
    0::numeric as roas    -- spend가 0이므로 roas도 0
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.channel
  order by revenue desc;  -- roas 대신 revenue로 정렬
end;
$$;

-- 3. public 래퍼 함수들도 업데이트
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

create or replace function public.board_roas_by_channel(
  p_category text[] default null,
  p_channel text[] default null,
  p_from date default null,
  p_region text[] default null,
  p_sku text[] default null,
  p_to date default null
)
returns table (
  channel text,
  revenue numeric,
  spend numeric,
  roas numeric
)
language sql stable security definer as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

-- 4. 권한 부여
grant execute on function analytics.board_sales_daily(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_sales_daily(text[], text[], date, text[], text[], date) to anon, authenticated;
grant execute on function public.board_roas_by_channel(text[], text[], date, text[], text[], date) to anon, authenticated;

-- 5. 스키마 리로드
select pg_notify('pgrst','reload schema');
