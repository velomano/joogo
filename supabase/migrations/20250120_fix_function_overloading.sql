-- 함수 오버로딩 충돌 해결

-- 기존 board_top_skus 함수들 삭제
drop function if exists public.board_top_skus(uuid, date, date, integer, text, text, text);
drop function if exists public.board_top_skus(uuid, date, date, integer, text, text, text, text);

-- 새로운 board_top_skus 함수 생성 (단일 시그니처)
create or replace function public.board_top_skus(
  p_tenant_id uuid,
  p_from      date default null,
  p_to        date default null,
  p_limit     int  default 10,
  p_region    text default null,
  p_channel   text default null,
  p_category  text default null,
  p_sku       text default null
)
returns table (
  sku      text,
  qty      numeric,
  revenue  numeric
)
language sql
security definer
set search_path = public, analytics
as $$
  select 
    f.sku,
    sum(coalesce(f.qty, 0)) as qty,
    sum(coalesce(f.revenue, 0)) as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and (p_from is null or f.sale_date >= p_from)
    and (p_to   is null or f.sale_date <= p_to)
    and (p_region is null or f.region = p_region)
    and (p_channel is null or f.channel = p_channel)
    and (p_category is null or f.category = p_category)
    and (p_sku is null or f.sku = p_sku)
  group by f.sku
  order by revenue desc
  limit p_limit;
$$;

-- 권한 부여
grant execute on function public.board_top_skus(uuid, date, date, integer, text, text, text, text)
  to anon, authenticated, service_role;

-- 스키마 캐시 리로드
select public.pgrst_reload_schema();
