-- 17단계: 모든 함수 완전 삭제 후 재생성

-- 1. 모든 기존 함수들 완전 삭제 (모든 시그니처)
drop function if exists public.board_sales_daily();
drop function if exists public.board_sales_daily(date,date,text[],text[],text[],text[]);
drop function if exists public.board_roas_by_channel();
drop function if exists public.board_roas_by_channel(date,date,text[],text[],text[],text[]);
drop function if exists public.board_top_categories();
drop function if exists public.board_top_categories(date,date,text[],text[],text[],text[]);
drop function if exists public.board_top_regions();
drop function if exists public.board_top_regions(date,date,text[],text[],text[],text[]);
drop function if exists public.board_top_skus();
drop function if exists public.board_top_skus(date,date,text[],text[],text[],text[]);

-- analytics 함수들도 삭제
drop function if exists analytics.board_sales_daily(date,date,text[],text[],text[],text[]);
drop function if exists analytics.board_roas_by_channel(date,date,text[],text[],text[],text[]);
drop function if exists analytics.board_top_categories(date,date,text[],text[],text[],text[]);
drop function if exists analytics.board_top_regions(date,date,text[],text[],text[],text[]);
drop function if exists analytics.board_top_skus(date,date,text[],text[],text[],text[]);

-- 2. 스키마 리로드
select pg_notify('pgrst','reload schema');

-- 3. analytics 함수들 생성 (실제 테이블 구조에 맞게)
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

-- 4. public 래퍼 함수들 생성 (정확한 파라미터 이름으로)
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

create function public.board_sales_daily()
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

create function public.board_roas_by_channel(
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

create function public.board_roas_by_channel()
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

create function public.board_top_categories(
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

create function public.board_top_categories()
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

create function public.board_top_regions(
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

create function public.board_top_regions()
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

create function public.board_top_skus(
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

create function public.board_top_skus()
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

-- 5. 권한 부여
grant execute on function analytics.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_roas_by_channel(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_categories(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_regions(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;
grant execute on function analytics.board_top_skus(date,date,text[],text[],text[],text[]) to anon, authenticated, service_role;

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

-- 6. PostgREST 스키마 캐시 리로드
select pg_notify('pgrst','reload schema');
