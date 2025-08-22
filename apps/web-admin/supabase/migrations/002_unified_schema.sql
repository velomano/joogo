-- 통합 데이터 업로드 시스템을 위한 스키마 확장
-- 기존 테이블이 있다면 컬럼 추가, 없다면 새로 생성

-- items 테이블 확장 (재고 스냅샷)
create table if not exists public.items (
  tenant_id uuid not null,
  barcode bigint not null,
  productName text,
  product_name text,
  option_name text,
  qty integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (tenant_id, barcode)
);

-- sales 테이블 확장 (판매 트랜잭션)
create table if not exists public.sales (
  tenant_id uuid not null,
  sale_date date not null,
  barcode bigint not null,
  productName text,
  product_name text,
  option_name text,
  qty integer not null,
  unit_price numeric not null,
  revenue numeric not null,
  channel text not null check (channel in ('online','offline','wholesale','snapshot')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 인덱스 생성
create unique index if not exists items_tenant_barcode_uidx on items(tenant_id, barcode);
create index if not exists sales_tenant_date_idx on sales(tenant_id, sale_date);
create index if not exists sales_barcode_idx on sales(barcode);
create unique index if not exists sales_row_uidx 
  on sales(tenant_id, sale_date, barcode, channel, unit_price);

-- 기존 테이블에 누락된 컬럼 추가 (이미 존재하는 경우 무시)
do $$
begin
  -- items 테이블에 product_name, option_name 컬럼 추가
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'product_name') then
    alter table public.items add column product_name text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'items' and column_name = 'option_name') then
    alter table public.items add column option_name text;
  end if;
  
  -- sales 테이블에 product_name, option_name 컬럼 추가
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'product_name') then
    alter table public.sales add column product_name text;
  end if;
  
  if not exists (select 1 from information_schema.columns where table_name = 'sales' and column_name = 'option_name') then
    alter table public.sales add column option_name text;
  end if;
end $$;

-- RLS (Row Level Security) 설정
alter table public.items enable row level security;
alter table public.sales enable row level security;

-- 테넌트별 접근 정책
create policy "Users can view own tenant items" on public.items
  for select using (auth.jwt() ->> 'tenant_id' = tenant_id::text);

create policy "Users can insert own tenant items" on public.items
  for insert with check (auth.jwt() ->> 'tenant_id' = tenant_id::text);

create policy "Users can update own tenant items" on public.items
  for update using (auth.jwt() ->> 'tenant_id' = tenant_id::text);

create policy "Users can view own tenant sales" on public.sales
  for select using (auth.jwt() ->> 'tenant_id' = tenant_id::text);

create policy "Users can insert own tenant sales" on public.sales
  for insert with check (auth.jwt() ->> 'tenant_id' = tenant_id::text);

create policy "Users can update own tenant sales" on public.sales
  for update using (auth.jwt() ->> 'tenant_id' = tenant_id::text);

-- 업데이트 트리거 (updated_at 자동 갱신)
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_items_updated_at before update on public.items
  for each row execute function update_updated_at_column();

-- 뷰 생성 (통합 데이터 조회용)
create or replace view public.unified_data as
select 
  'item' as data_type,
  tenant_id,
  barcode,
  productName,
  product_name,
  option_name,
  qty,
  null as sale_date,
  null as unit_price,
  null as revenue,
  null as channel,
  created_at,
  updated_at
from public.items
union all
select 
  'sale' as data_type,
  tenant_id,
  barcode,
  productName,
  product_name,
  option_name,
  qty,
  sale_date,
  unit_price,
  revenue,
  channel,
  created_at,
  null as updated_at
from public.sales
where channel != 'snapshot';

-- 통계 함수들
create or replace function public.get_sales_summary(
  p_tenant_id uuid,
  p_from_date date,
  p_to_date date
)
returns table (
  total_units bigint,
  total_revenue numeric,
  total_orders bigint,
  avg_order_value numeric
) as $$
begin
  return query
  select 
    sum(qty)::bigint as total_units,
    sum(revenue) as total_revenue,
    count(*)::bigint as total_orders,
    case when count(*) > 0 then sum(revenue) / count(*) else 0 end as avg_order_value
  from public.sales
  where tenant_id = p_tenant_id
    and sale_date >= p_from_date
    and sale_date <= p_to_date
    and channel != 'snapshot';
end;
$$ language plpgsql security definer;

-- 주석
comment on table public.items is '재고 스냅샷 데이터';
comment on table public.sales is '판매 트랜잭션 데이터';
comment on view public.unified_data is '재고와 판매 데이터 통합 뷰';
comment on function public.get_sales_summary is '기간별 판매 요약 통계';
