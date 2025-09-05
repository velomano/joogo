-- analytics 스키마의 실제 RPC 함수들 생성

-- 기존 함수들 삭제
drop function if exists analytics.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_skus(date, date, text[], text[], text[], text[]);

-- 1. board_sales_daily
create or replace function analytics.board_sales_daily(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(
  date date,
  qty numeric,
  revenue numeric,
  spend numeric,
  roas numeric,
  tavg numeric,
  is_event int
)
language plpgsql
stable
security definer
as $$
begin
  -- 임시로 빈 결과 반환 (실제 구현 필요)
  return query
  select 
    current_date as date,
    0::numeric as qty,
    0::numeric as revenue,
    0::numeric as spend,
    0::numeric as roas,
    0::numeric as tavg,
    0::int as is_event
  where false;
end;
$$;

-- 2. board_roas_by_channel
create or replace function analytics.board_roas_by_channel(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(
  channel text,
  revenue numeric,
  spend numeric,
  roas numeric
)
language plpgsql
stable
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
create or replace function analytics.board_top_categories(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(
  category text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
stable
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
create or replace function analytics.board_top_regions(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(
  region text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
stable
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
create or replace function analytics.board_top_skus(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(
  sku text,
  revenue numeric,
  quantity bigint,
  percentage numeric
)
language plpgsql
stable
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
grant execute on function analytics.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_roas_by_channel(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_categories(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_regions(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_skus(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
