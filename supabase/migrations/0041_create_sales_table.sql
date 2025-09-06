-- 0041_create_sales_table.sql
-- public.sales 테이블 생성 (실제 데이터 구조에 맞게)

set role postgres;

-- public.sales 테이블 생성
create table if not exists public.sales (
  tenant_id uuid not null,
  sale_date date not null,
  barcode bigint not null,
  productname text,
  qty integer not null,
  unit_price numeric not null,
  revenue numeric not null,
  channel text not null check (channel in ('online','offline','wholesale'))
);

-- 인덱스 생성
create index if not exists sales_tenant_date_idx on public.sales (tenant_id, sale_date);
create index if not exists sales_barcode_idx on public.sales (barcode);

-- 샘플 데이터 삽입 (테스트용)
insert into public.sales (tenant_id, sale_date, barcode, productname, qty, unit_price, revenue, channel)
values 
  ('00000000-0000-0000-0000-000000000001', '2024-01-01', 1234567890, '테스트상품1', 10, 1000, 10000, 'online'),
  ('00000000-0000-0000-0000-000000000001', '2024-01-02', 1234567891, '테스트상품2', 5, 2000, 10000, 'offline'),
  ('00000000-0000-0000-0000-000000000001', '2024-01-03', 1234567892, '테스트상품3', 3, 3000, 9000, 'wholesale')
on conflict do nothing;

-- RLS 정책 (선택사항)
-- alter table public.sales enable row level security;
-- create policy "Users can view own tenant sales" on public.sales for select using (tenant_id = current_setting('app.tenant_id')::uuid);
