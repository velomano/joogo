-- Sales 테이블 생성
create table if not exists public.sales (
  tenant_id uuid not null,
  sale_date date not null,
  barcode bigint not null,
  productName text,
  qty integer not null,
  unit_price numeric not null,
  revenue numeric not null,
  channel text not null check (channel in ('online','offline','wholesale'))
);

-- 인덱스 생성
create index if not exists sales_tenant_date_idx on public.sales (tenant_id, sale_date);
create index if not exists sales_barcode_idx on public.sales (barcode);

-- RLS 정책 (선택사항)
-- alter table public.sales enable row level security;
-- create policy "Users can view own tenant sales" on public.sales for select using (tenant_id = current_setting('app.tenant_id')::uuid);
