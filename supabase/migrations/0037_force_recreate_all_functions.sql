-- 0037_force_recreate_all_functions.sql
-- 모든 함수를 강제로 삭제하고 다시 생성

set role postgres;

-- 모든 public 함수 삭제
drop function if exists public.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text);
drop function if exists public.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists public.board_roas_by_channel(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_categories(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_regions(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_skus(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_skus(uuid, date, date, text, text, text, text);
drop function if exists public.board_abc_by_sku(date, date, text[], text[], text[], text[]);
drop function if exists public.board_abc_by_sku(uuid, date, date, text, text, text, text);
drop function if exists public.board_inventory_analysis(date, date, text[], text[], text[], text[]);
drop function if exists public.board_inventory_analysis(uuid, date, date, text, text, text, text);
drop function if exists public.board_merge_file(uuid, uuid);

-- 모든 analytics 함수 삭제
drop function if exists analytics.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_skus(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_abc_by_sku(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_inventory_analysis(date, date, text[], text[], text[], text[]);

-- 기본 RPC 함수들 재생성 (0-인자 버전)
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
