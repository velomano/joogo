-- 8단계: 모든 함수 완전 삭제 후 한 번에 생성

-- 1. 모든 analytics 함수들 삭제
drop function if exists analytics.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_skus(date, date, text[], text[], text[], text[]);

-- 2. 모든 public 함수들 삭제
drop function if exists public.board_sales_daily;
drop function if exists public.board_roas_by_channel;
drop function if exists public.board_top_categories;
drop function if exists public.board_top_regions;
drop function if exists public.board_top_skus;

-- 3. 스키마 리로드
select pg_notify('pgrst','reload schema');

-- 4. analytics 함수들 생성
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
  revenue numeric,
  orders bigint,
  aov numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.sale_date as date,
    sum(fs.revenue) as revenue,
    count(*) as orders,
    avg(fs.revenue) as aov
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

create function analytics.board_roas_by_channel(
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
    sum(fs.spend) as spend,
    case 
      when sum(fs.spend) > 0 then sum(fs.revenue) / sum(fs.spend)
      else 0
    end as roas
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.channel
  order by roas desc;
end;
$$;

create function analytics.board_top_categories(
  p_from date,
  p_to date,
  p_region text[],
  p_channel text[],
  p_category text[],
  p_sku text[]
)
returns table (
  category text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.category,
    sum(fs.revenue) as revenue,
    count(*) as orders
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.category
  order by revenue desc
  limit 10;
end;
$$;

create function analytics.board_top_regions(
  p_from date,
  p_to date,
  p_region text[],
  p_channel text[],
  p_category text[],
  p_sku text[]
)
returns table (
  region text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.region,
    sum(fs.revenue) as revenue,
    count(*) as orders
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.region
  order by revenue desc
  limit 10;
end;
$$;

create function analytics.board_top_skus(
  p_from date,
  p_to date,
  p_region text[],
  p_channel text[],
  p_category text[],
  p_sku text[]
)
returns table (
  sku text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select 
    fs.sku,
    sum(fs.revenue) as revenue,
    count(*) as orders
  from analytics.fact_sales fs
  where fs.tenant_id = analytics.current_tenant_id()
    and (p_from is null or fs.sale_date >= p_from)
    and (p_to is null or fs.sale_date <= p_to)
    and (p_region is null or fs.region = any(p_region))
    and (p_channel is null or fs.channel = any(p_channel))
    and (p_category is null or fs.category = any(p_category))
    and (p_sku is null or fs.sku = any(p_sku))
  group by fs.sku
  order by revenue desc
  limit 10;
end;
$$;

-- 5. public 래퍼 함수들 생성
create function public.board_sales_daily(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table (
  date date,
  revenue numeric,
  orders bigint,
  aov numeric
)
language plpgsql
security definer
as $$
begin
  return query
  select * from analytics.board_sales_daily(p_from, p_to, p_region, p_channel, p_category, p_sku);
end;
$$;

create function public.board_roas_by_channel(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
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
  select * from analytics.board_roas_by_channel(p_from, p_to, p_region, p_channel, p_category, p_sku);
end;
$$;

create function public.board_top_categories(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table (
  category text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select * from analytics.board_top_categories(p_from, p_to, p_region, p_channel, p_category, p_sku);
end;
$$;

create function public.board_top_regions(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table (
  region text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select * from analytics.board_top_regions(p_from, p_to, p_region, p_channel, p_category, p_sku);
end;
$$;

create function public.board_top_skus(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table (
  sku text,
  revenue numeric,
  orders bigint
)
language plpgsql
security definer
as $$
begin
  return query
  select * from analytics.board_top_skus(p_from, p_to, p_region, p_channel, p_category, p_sku);
end;
$$;

-- 6. 권한 부여
grant execute on function analytics.board_sales_daily(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_categories(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_regions(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_skus(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;

grant execute on function public.board_sales_daily(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_roas_by_channel(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_top_categories(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_top_regions(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;
grant execute on function public.board_top_skus(date, date, text[], text[], text[], text[]) to anon, authenticated, service_role;

-- 7. 최종 스키마 리로드
select pg_notify('pgrst','reload schema');
