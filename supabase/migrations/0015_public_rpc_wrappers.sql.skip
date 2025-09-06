-- ✅ board_sales_daily (파라미터/무파라미터 모두)
create or replace function public.board_sales_daily(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int)
language sql stable security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

create or replace function public.board_sales_daily()
returns table(date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int)
language sql stable security definer
as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(null,null,null,null,null,null)
$$;

-- ✅ board_roas_by_channel
create or replace function public.board_roas_by_channel(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(channel text, revenue numeric, spend numeric, roas numeric)
language sql stable security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

create or replace function public.board_roas_by_channel()
returns table(channel text, revenue numeric, spend numeric, roas numeric)
language sql stable security definer
as $$
  select channel, revenue, spend, roas
  from analytics.board_roas_by_channel(null,null,null,null,null,null)
$$;

-- ✅ board_top_categories
create or replace function public.board_top_categories(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(category text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select category, revenue, quantity, percentage
  from analytics.board_top_categories(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

create or replace function public.board_top_categories()
returns table(category text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select category, revenue, quantity, percentage
  from analytics.board_top_categories(null,null,null,null,null,null)
$$;

-- ✅ board_top_regions
create or replace function public.board_top_regions(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(region text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select region, revenue, quantity, percentage
  from analytics.board_top_regions(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

create or replace function public.board_top_regions()
returns table(region text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select region, revenue, quantity, percentage
  from analytics.board_top_regions(null,null,null,null,null,null)
$$;

-- ✅ board_top_skus
create or replace function public.board_top_skus(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
)
returns table(sku text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select sku, revenue, quantity, percentage
  from analytics.board_top_skus(p_from, p_to, p_region, p_channel, p_category, p_sku)
$$;

create or replace function public.board_top_skus()
returns table(sku text, revenue numeric, quantity bigint, percentage numeric)
language sql stable security definer
as $$
  select sku, revenue, quantity, percentage
  from analytics.board_top_skus(null,null,null,null,null,null)
$$;

-- 권한 부여
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

-- 🔄 PostgREST 스키마 캐시 리로드
select pg_notify('pgrst','reload schema');
