-- 0038_nuclear_cleanup.sql
-- 모든 함수와 테이블을 강제로 삭제하고 깨끗하게 시작

set role postgres;

-- 모든 public 함수 삭제 (CASCADE로 의존성까지 삭제)
drop schema if exists public cascade;
create schema public;

-- analytics 스키마 재생성
drop schema if exists analytics cascade;
create schema analytics;

-- 기본 테이블들만 재생성
create table analytics.data_version (
  tenant_id uuid primary key,
  version bigint not null default 1,
  updated_at timestamptz default now()
);

create table analytics.ingest_jobs (
  tenant_id uuid not null,
  file_id uuid not null,
  status text not null check (status in ('uploading','staging','merging','merged','failed')),
  rows_staged int default 0,
  rows_merged int default 0,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (tenant_id, file_id)
);

create table analytics.csv_header_map (
  tenant_id uuid not null,
  alias text not null,
  canonical text not null,
  created_at timestamptz default now(),
  primary key (tenant_id, alias)
);

-- RLS 활성화
alter table analytics.data_version enable row level security;
alter table analytics.ingest_jobs enable row level security;
alter table analytics.csv_header_map enable row level security;

-- 기본 정책 설정
create policy data_version_sel on analytics.data_version for select to authenticated using (true);
create policy data_version_upd on analytics.data_version for update to service_role using (true);
create policy data_version_ins on analytics.data_version for insert to service_role with check (true);

create policy ingest_jobs_sel on analytics.ingest_jobs for select to authenticated using (true);
create policy ingest_jobs_ins on analytics.ingest_jobs for insert to service_role with check (true);
create policy ingest_jobs_upd on analytics.ingest_jobs for update to service_role using (true);

create policy csv_header_map_sel on analytics.csv_header_map for select to authenticated using (true);
create policy csv_header_map_ins on analytics.csv_header_map for insert to service_role with check (true);
create policy csv_header_map_upd on analytics.csv_header_map for update to service_role using (true);

-- 기본 함수들 생성
create or replace function analytics.current_tenant_id()
returns uuid
language sql stable
as $$
  select coalesce(
    current_setting('app.tenant_id', true)::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

create or replace function analytics.bump_data_version(p_tenant_id uuid)
returns bigint
language plpgsql
security definer
as $$
declare
  newv bigint;
begin
  insert into analytics.data_version (tenant_id, version)
  values (p_tenant_id, 1)
  on conflict (tenant_id) do update set
    version = data_version.version + 1,
    updated_at = now()
  returning version into newv;
  return newv;
end;
$$;

-- 기본 RPC 함수들 생성 (0-인자 버전)
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
