-- Board RPC 함수들 생성
-- 이 함수들은 실제 데이터를 반환하도록 구현되어야 함

-- 기존 함수들 삭제
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text);
drop function if exists public.board_roas_by_channel(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_categories(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_regions(uuid, date, date, text, text, text, text);
drop function if exists public.board_top_skus(uuid, date, date, text, text, text, text);

-- 1. board_sales_daily
create or replace function public.board_sales_daily(
  p_tenant_id uuid,
  p_from date default null,
  p_to date default null,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(
  date date,
  revenue numeric,
  quantity bigint,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    current_date as date,
    0::numeric as revenue,
    0::bigint as quantity,
    0::bigint as orders
  where false;
end;
$$;

-- 2. board_roas_by_channel
create or replace function public.board_roas_by_channel(
  p_tenant_id uuid,
  p_from date default null,
  p_to date default null,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(
  channel text,
  revenue numeric,
  spend numeric,
  roas numeric
)
language plpgsql
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    'test'::text as channel,
    0::numeric as revenue,
    0::numeric as spend,
    0::numeric as roas
  where false;
end;
$$;

-- 3. board_top_categories
create or replace function public.board_top_categories(
  p_tenant_id uuid,
  p_from date default null,
  p_to date default null,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(
  category text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    'test'::text as category,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
end;
$$;

-- 4. board_top_regions
create or replace function public.board_top_regions(
  p_tenant_id uuid,
  p_from date default null,
  p_to date default null,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(
  region text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    'test'::text as region,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
end;
$$;

-- 5. board_top_skus
create or replace function public.board_top_skus(
  p_tenant_id uuid,
  p_from date default null,
  p_to date default null,
  p_region text default null,
  p_channel text default null,
  p_category text default null,
  p_sku text default null
)
returns table(
  sku text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    'test'::text as sku,
    0::numeric as revenue,
    0::bigint as quantity,
    0::numeric as percentage
  where false;
end;
$$;

-- 권한 부여
grant execute on function public.board_sales_daily(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.board_roas_by_channel(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.board_top_categories(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.board_top_regions(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;
grant execute on function public.board_top_skus(uuid, date, date, text, text, text, text) to anon, authenticated, service_role;

-- 스키마 리로드
notify pgrst, 'reload schema';
