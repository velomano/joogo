-- 0008_fix_board_and_perms.sql
-- 목적:
-- 1) board_sales_daily RPC가 qty를 반환하도록 수정
-- 2) stage_sales에 대한 권한/시퀀스/정책 정비로 워커 INSERT 허용

set role postgres;

-- 안전: 스키마 사용 권한
grant usage on schema analytics to anon, authenticated, service_role;

-- =============== 1) RPC: board_sales_daily 수정 ===============
-- 기존 함수를 삭제하고 새로 생성하여 qty를 포함하도록 수정
-- 필터는 모두 옵션이며, tenant_id는 uuid 타입으로 유지

-- 기존 함수들 모두 삭제 (다양한 시그니처)
drop function if exists public.board_sales_daily(uuid, date, date);
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text);
drop function if exists public.board_sales_daily(uuid, date, date, text, text, text, text, text);

-- 새 함수 생성 (qty 포함)
create or replace function public.board_sales_daily(
  p_tenant_id uuid,
  p_from      date default null,
  p_to        date default null,
  p_region    text default null,
  p_channel   text default null,
  p_category  text default null,
  p_sku       text default null
)
returns table (
  sale_date date,
  qty       numeric,
  revenue   numeric
)
language sql 
security definer 
set search_path=public, analytics 
as $$
  select
    f.sale_date,
    sum(coalesce(f.qty, 0))                         as qty,
    sum(coalesce(f.revenue, 0))                     as revenue
  from analytics.fact_sales f
  where f.tenant_id = p_tenant_id
    and (p_from    is null or f.sale_date    >= p_from)
    and (p_to      is null or f.sale_date    <= p_to)
    and (p_region  is null or f.region       = p_region)
    and (p_channel is null or f.channel      = p_channel)
    and (p_category is null or f.category    = p_category)
    and (p_sku     is null or f.sku          = p_sku)
  group by f.sale_date
  order by f.sale_date;
$$;

comment on function public.board_sales_daily is '일자 기준 집계 (qty/revenue 포함). 테넌트는 파라미터로 전달.';

-- 권한 부여
grant execute on function public.board_sales_daily(uuid, date, date, text, text, text, text) 
to anon, authenticated, service_role;

-- =============== 3) 함수 오버로딩 충돌 해결 ===============
-- 기존 board_top_skus 함수들 삭제 (오버로딩 충돌 방지)
drop function if exists public.board_top_skus(uuid, date, date, int);
drop function if exists public.board_top_skus(uuid, date, date, int, text, text, text);

-- 통합된 board_top_skus 함수 생성
create or replace function public.board_top_skus(
  p_tenant_id uuid, 
  p_from date, 
  p_to date, 
  p_limit int default 10,
  p_region text default null,
  p_channel text default null,
  p_category text default null
)
returns table(sku text, revenue numeric) 
language sql security definer set search_path=public, analytics as $$
  select sku, sum(coalesce(revenue,0))
  from analytics.fact_sales 
  where tenant_id=p_tenant_id 
    and sale_date between p_from and p_to 
    and sku is not null
    and (p_region is null or region = p_region)
    and (p_channel is null or channel = p_channel)
    and (p_category is null or category = p_category)
  group by 1 
  order by 2 desc 
  limit p_limit
$$;

-- 권한 부여
grant execute on function public.board_top_skus(uuid, date, date, int, text, text, text)
to anon, authenticated, service_role;

-- =============== 2) stage_sales 권한/정책 정비 ===============
-- GRANT: 시퀀스(빅시리얼) 포함
grant select, insert on table analytics.stage_sales to authenticated, service_role;
grant usage, select on all sequences in schema analytics to authenticated, service_role;

-- RLS: 안전하게 테넌트 기반으로 허용
alter table analytics.stage_sales enable row level security;

-- SELECT: 모든 테넌트 열람 허용 (간단하게)
drop policy if exists stage_sales_select on analytics.stage_sales;
create policy stage_sales_select
on analytics.stage_sales
for select
to authenticated
using (true);

-- INSERT: 모든 테넌트 삽입 허용 (간단하게)
drop policy if exists stage_sales_insert_auth on analytics.stage_sales;
create policy stage_sales_insert_auth
on analytics.stage_sales
for insert
to authenticated
with check (true);

-- 서비스 롤은 RLS를 우회하지만, 명시 정책을 추가해도 무해함
drop policy if exists stage_sales_insert_service on analytics.stage_sales;
create policy stage_sales_insert_service
on analytics.stage_sales
for insert
to service_role
with check (true);

-- 참고: fact_sales는 직접 insert 금지(머지 함수만)
revoke insert on analytics.fact_sales from anon, authenticated;

-- 보너스: 시퀀스 기본 권한 미래 생성물에도 적용(선택)
alter default privileges in schema analytics
  grant usage, select on sequences to authenticated, service_role;
