-- 19단계: 실제 테이블 구조 확인 및 함수 수정

-- 1. 실제 테이블 구조 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'analytics' 
  AND table_name = 'fact_sales'
ORDER BY ordinal_position;

-- 2. 기존 함수들 삭제
drop function if exists analytics.board_sales_daily(date,date,text[],text[],text[],text[]) cascade;
drop function if exists public.board_sales_daily(date,date,text[],text[],text[],text[]) cascade;

-- 3. 스키마 리로드
select pg_notify('pgrst','reload schema');

-- 4. 실제 컬럼명에 맞게 함수 생성
create function analytics.board_sales_daily(
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
    count(*)::numeric as qty,  -- quantity 컬럼이 없으므로 count(*)로 처리
    sum(fs.revenue) as revenue,
    0::numeric as spend,       -- spend 컬럼이 없으므로 0으로 처리
    0::numeric as roas,        -- spend가 0이므로 roas도 0
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

-- 5. public 래퍼 함수 생성
create function public.board_sales_daily(
  p_from     date    default null,
  p_to       date    default null,
  p_region   text[]  default null,
  p_channel  text[]  default null,
  p_category text[]  default null,
  p_sku      text[]  default null
)
returns table(
  date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int
)
language sql
stable
security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(
    p_from     := p_from,
    p_to       := p_to,
    p_region   := p_region,
    p_channel  := p_channel,
    p_category := p_category,
    p_sku      := p_sku
  )
$$;

-- 6. 권한 부여
grant execute on function analytics.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function public.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated;

-- 7. PostgREST 스키마 캐시 리로드
select pg_notify('pgrst','reload schema');
