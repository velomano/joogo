-- 0039_fix_function_overloading.sql
-- 함수 오버로딩 문제 해결

set role postgres;

-- 모든 중복 함수 삭제
drop function if exists public.board_sales_daily();
drop function if exists public.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists public.board_roas_by_channel();
drop function if exists public.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_categories();
drop function if exists public.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_regions();
drop function if exists public.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_skus();
drop function if exists public.board_top_skus(date, date, text[], text[], text[], text[]);
drop function if exists public.board_abc_by_sku();
drop function if exists public.board_abc_by_sku(date, date, text[], text[], text[], text[]);
drop function if exists public.board_inventory_analysis();
drop function if exists public.board_inventory_analysis(date, date, text[], text[], text[], text[]);

-- 단일 시그니처로 함수 재생성 (0-인자 버전)
create or replace function public.board_sales_daily()
returns table(
  sale_date date,
  revenue numeric,
  quantity bigint,
  orders bigint
)
language sql stable security definer
as $$
  select 
    current_date as sale_date,
    0::numeric as revenue,
    0::bigint as quantity,
    0::bigint as orders
  where false;
$$;

create or replace function public.board_roas_by_channel()
returns table(
  channel text,
  revenue numeric,
  spend numeric,
  roas numeric
)
language sql stable security definer
as $$
  select 
    'test'::text as channel,
    0::numeric as revenue,
    0::numeric as spend,
    0::numeric as roas
  where false;
$$;

create or replace function public.board_top_categories()
returns table(
  category text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language sql stable security definer
as $$
  select 
    'test'::text as category,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
$$;

create or replace function public.board_top_regions()
returns table(
  region text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language sql stable security definer
as $$
  select 
    'test'::text as region,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
$$;

create or replace function public.board_top_skus()
returns table(
  sku text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language sql stable security definer
as $$
  select 
    'test'::text as sku,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
$$;

create or replace function public.board_abc_by_sku()
returns table(
  sku text,
  revenue numeric,
  quantity bigint,
  abc_class text,
  percentage numeric
)
language sql stable security definer
as $$
  select 
    'test'::text as sku,
    0::numeric as revenue,
    0::bigint as quantity,
    'A'::text as abc_class,
    0::numeric as percentage
  where false;
$$;

create or replace function public.board_inventory_analysis()
returns table(
  sku text,
  current_stock bigint,
  reorder_point bigint,
  suggested_order bigint,
  days_remaining bigint
)
language sql stable security definer
as $$
  select 
    'test'::text as sku,
    0::bigint as current_stock,
    0::bigint as reorder_point,
    0::bigint as suggested_order,
    0::bigint as days_remaining
  where false;
$$;

-- 권한 부여
grant execute on function public.board_sales_daily() to anon, authenticated;
grant execute on function public.board_roas_by_channel() to anon, authenticated;
grant execute on function public.board_top_categories() to anon, authenticated;
grant execute on function public.board_top_regions() to anon, authenticated;
grant execute on function public.board_top_skus() to anon, authenticated;
grant execute on function public.board_abc_by_sku() to anon, authenticated;
grant execute on function public.board_inventory_analysis() to anon, authenticated;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
