-- 16단계: 원샷 패치 — public.board_sales_daily 못 찾는 오류 종결

-- 1. 기존 함수들 완전 삭제
drop function if exists public.board_sales_daily();
drop function if exists public.board_sales_daily(text[], text[], date, text[], text[], date);
drop function if exists public.board_roas_by_channel();
drop function if exists public.board_roas_by_channel(text[], text[], date, text[], text[], date);
drop function if exists public.board_top_categories();
drop function if exists public.board_top_categories(text[], text[], date, text[], text[], date);
drop function if exists public.board_top_regions();
drop function if exists public.board_top_regions(text[], text[], date, text[], text[], date);
drop function if exists public.board_top_skus();
drop function if exists public.board_top_skus(text[], text[], date, text[], text[], date);

-- 2. RPC 래퍼를 정규 시그니처로 다시 정의
-- ✅ 6-파라미터 정규 버전
create or replace function public.board_sales_daily(
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
  -- 이름으로 바인딩해서 순서 실수 방지
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

-- ✅ 0-인자 폴백 (클라이언트가 args 누락해도 안전)
create or replace function public.board_sales_daily()
returns table(
  date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int
)
language sql
stable
security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(null,null,null,null,null,null)
$$;

-- ✅ board_roas_by_channel
create or replace function public.board_roas_by_channel(
  p_from     date    default null,
  p_to       date    default null,
  p_region   text[]  default null,
  p_channel  text[]  default null,
  p_category text[]  default null,
  p_sku      text[]  default null
)
returns table(
  channel text, revenue numeric, spend numeric, roas numeric
)
language sql
stable
security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(
    p_from     := p_from,
    p_to       := p_to,
    p_region   := p_region,
    p_channel  := p_channel,
    p_category := p_category,
    p_sku      := p_sku
  )
$$;

create or replace function public.board_roas_by_channel()
returns table(
  channel text, revenue numeric, spend numeric, roas numeric
)
language sql
stable
security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(null,null,null,null,null,null)
$$;

-- ✅ board_top_categories
create or replace function public.board_top_categories(
  p_from     date    default null,
  p_to       date    default null,
  p_region   text[]  default null,
  p_channel  text[]  default null,
  p_category text[]  default null,
  p_sku      text[]  default null
)
returns table(
  category text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select category, revenue, orders
  from analytics.board_top_categories(
    p_from     := p_from,
    p_to       := p_to,
    p_region   := p_region,
    p_channel  := p_channel,
    p_category := p_category,
    p_sku      := p_sku
  )
$$;

create or replace function public.board_top_categories()
returns table(
  category text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select category, revenue, orders
  from analytics.board_top_categories(null,null,null,null,null,null)
$$;

-- ✅ board_top_regions
create or replace function public.board_top_regions(
  p_from     date    default null,
  p_to       date    default null,
  p_region   text[]  default null,
  p_channel  text[]  default null,
  p_category text[]  default null,
  p_sku      text[]  default null
)
returns table(
  region text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select region, revenue, orders
  from analytics.board_top_regions(
    p_from     := p_from,
    p_to       := p_to,
    p_region   := p_region,
    p_channel  := p_channel,
    p_category := p_category,
    p_sku      := p_sku
  )
$$;

create or replace function public.board_top_regions()
returns table(
  region text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select region, revenue, orders
  from analytics.board_top_regions(null,null,null,null,null,null)
$$;

-- ✅ board_top_skus
create or replace function public.board_top_skus(
  p_from     date    default null,
  p_to       date    default null,
  p_region   text[]  default null,
  p_channel  text[]  default null,
  p_category text[]  default null,
  p_sku      text[]  default null
)
returns table(
  sku text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select sku, revenue, orders
  from analytics.board_top_skus(
    p_from     := p_from,
    p_to       := p_to,
    p_region   := p_region,
    p_channel  := p_channel,
    p_category := p_category,
    p_sku      := p_sku
  )
$$;

create or replace function public.board_top_skus()
returns table(
  sku text, revenue numeric, orders bigint
)
language sql
stable
security definer
as $$
  select sku, revenue, orders
  from analytics.board_top_skus(null,null,null,null,null,null)
$$;

-- 3. 권한 부여
grant execute on function public.board_sales_daily() to anon, authenticated;
grant execute on function public.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_roas_by_channel() to anon, authenticated;
grant execute on function public.board_roas_by_channel(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_categories() to anon, authenticated;
grant execute on function public.board_top_categories(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_regions() to anon, authenticated;
grant execute on function public.board_top_regions(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_top_skus() to anon, authenticated;
grant execute on function public.board_top_skus(date,date,text[],text[],text[],text[]) to anon, authenticated;

-- 4. PostgREST 스키마 캐시 리로드 (중요)
select pg_notify('pgrst','reload schema');

-- 5. 확인 쿼리
-- public에 실제로 올라왔는지
select routine_schema, routine_name
from information_schema.routines
where routine_schema='public' and routine_name like 'board_%';

-- 파라미터 이름이 정확한지
select p.proname, p.proargnames
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='board_sales_daily';
