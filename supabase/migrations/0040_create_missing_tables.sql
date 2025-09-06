-- 0040_create_missing_tables.sql
-- 누락된 테이블들 생성

set role postgres;

-- analytics 스키마가 없으면 생성
create schema if not exists analytics;

-- fact_sales 테이블 생성
create table if not exists analytics.fact_sales (
  tenant_id uuid not null,
  file_id uuid not null,
  sale_date date not null,
  region text,
  channel text,
  category text,
  sku text not null,
  qty numeric not null default 0,
  revenue numeric not null default 0,
  ad_cost numeric default 0,
  discount_rate numeric default 0,
  tavg numeric,
  original_data jsonb,
  created_at timestamptz default now(),
  primary key (tenant_id, file_id, sale_date, region, channel, category, sku)
);

-- stage_sales 테이블 생성
create table if not exists analytics.stage_sales (
  tenant_id uuid not null,
  file_id uuid not null,
  row_num int not null,
  sku text not null,
  sale_date text not null,
  qty text not null,
  revenue text not null,
  channel text,
  region text,
  category text,
  extras text,
  created_at timestamptz default now(),
  primary key (tenant_id, file_id, row_num)
);

-- raw_uploads 테이블 생성
create table if not exists analytics.raw_uploads (
  file_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  filename text not null,
  path text not null,
  status text not null check (status in ('RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED')),
  error text,
  staged_at timestamptz,
  created_at timestamptz default now()
);

-- items 테이블 생성 (public 스키마)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  sku text not null,
  name text,
  category text,
  brand text,
  current_stock bigint default 0,
  reorder_point bigint default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 활성화
alter table analytics.fact_sales enable row level security;
alter table analytics.stage_sales enable row level security;
alter table analytics.raw_uploads enable row level security;
alter table public.items enable row level security;

-- 기본 정책 설정
create policy fact_sales_tenant_access on analytics.fact_sales
  for all to authenticated
  using (tenant_id = analytics.current_tenant_id());

create policy stage_sales_tenant_access on analytics.stage_sales
  for all to authenticated
  using (tenant_id = analytics.current_tenant_id());

create policy raw_uploads_tenant_access on analytics.raw_uploads
  for all to authenticated
  using (tenant_id = analytics.current_tenant_id());

create policy items_tenant_access on public.items
  for all to authenticated
  using (tenant_id = analytics.current_tenant_id());

-- 서비스 역할 권한 부여
grant all on analytics.fact_sales to service_role;
grant all on analytics.stage_sales to service_role;
grant all on analytics.raw_uploads to service_role;
grant all on public.items to service_role;
