-- 0036: CSV 헤더 매핑 시스템 구축

-- 1. CSV 헤더 매핑 테이블 생성
create table if not exists analytics.csv_header_map(
  tenant_id uuid not null,
  alias text not null,          -- 들어온 헤더(원본)
  canonical text not null,      -- 표준 컬럼명
  updated_at timestamptz default now(),
  primary key (tenant_id, alias)
);

-- 2. 글로벌 기본 매핑 (tenant_id = 00000000-0000-0000-0000-000000000000)
insert into analytics.csv_header_map(tenant_id, alias, canonical)
values
  -- 날짜 관련
  ('00000000-0000-0000-0000-000000000000','Date','date'),
  ('00000000-0000-0000-0000-000000000000','날짜','date'),
  ('00000000-0000-0000-0000-000000000000','date','date'),
  ('00000000-0000-0000-0000-000000000000','판매일','date'),
  ('00000000-0000-0000-0000-000000000000','판매일자','date'),
  
  -- 지역 관련
  ('00000000-0000-0000-0000-000000000000','Region','region'),
  ('00000000-0000-0000-0000-000000000000','지역','region'),
  ('00000000-0000-0000-0000-000000000000','region','region'),
  ('00000000-0000-0000-0000-000000000000','판매지역','region'),
  
  -- 채널 관련
  ('00000000-0000-0000-0000-000000000000','Channel','channel'),
  ('00000000-0000-0000-0000-000000000000','채널','channel'),
  ('00000000-0000-0000-0000-000000000000','channel','channel'),
  ('00000000-0000-0000-0000-000000000000','판매채널','channel'),
  
  -- 카테고리 관련
  ('00000000-0000-0000-0000-000000000000','Category','category'),
  ('00000000-0000-0000-0000-000000000000','카테고리','category'),
  ('00000000-0000-0000-0000-000000000000','category','category'),
  ('00000000-0000-0000-0000-000000000000','상품카테고리','category'),
  
  -- SKU 관련
  ('00000000-0000-0000-0000-000000000000','SKU','sku'),
  ('00000000-0000-0000-0000-000000000000','상품코드','sku'),
  ('00000000-0000-0000-0000-000000000000','sku','sku'),
  ('00000000-0000-0000-0000-000000000000','상품명','sku'),
  ('00000000-0000-0000-0000-000000000000','제품코드','sku'),
  
  -- 수량 관련
  ('00000000-0000-0000-0000-000000000000','Quantity','qty'),
  ('00000000-0000-0000-0000-000000000000','판매수량','qty'),
  ('00000000-0000-0000-0000-000000000000','quantity','qty'),
  ('00000000-0000-0000-0000-000000000000','qty','qty'),
  ('00000000-0000-0000-0000-000000000000','수량','qty'),
  
  -- 단가 관련
  ('00000000-0000-0000-0000-000000000000','Unit Price','unit_price'),
  ('00000000-0000-0000-0000-000000000000','단가','unit_price'),
  ('00000000-0000-0000-0000-000000000000','unit_price','unit_price'),
  ('00000000-0000-0000-0000-000000000000','판매단가','unit_price'),
  ('00000000-0000-0000-0000-000000000000','가격','unit_price'),
  
  -- 할인율 관련
  ('00000000-0000-0000-0000-000000000000','Discount Rate','discount_rate'),
  ('00000000-0000-0000-0000-000000000000','할인율','discount_rate'),
  ('00000000-0000-0000-0000-000000000000','discount_rate','discount_rate'),
  ('00000000-0000-0000-0000-000000000000','할인','discount_rate'),
  
  -- 원가 관련
  ('00000000-0000-0000-0000-000000000000','Unit Cost','unit_cost'),
  ('00000000-0000-0000-0000-000000000000','원가','unit_cost'),
  ('00000000-0000-0000-0000-000000000000','unit_cost','unit_cost'),
  ('00000000-0000-0000-0000-000000000000','제조원가','unit_cost'),
  
  -- 매출 관련
  ('00000000-0000-0000-0000-000000000000','Revenue','revenue'),
  ('00000000-0000-0000-0000-000000000000','매출','revenue'),
  ('00000000-0000-0000-0000-000000000000','revenue','revenue'),
  ('00000000-0000-0000-0000-000000000000','판매금액','revenue'),
  ('00000000-0000-0000-0000-000000000000','금액','revenue'),
  
  -- 평균기온 관련
  ('00000000-0000-0000-0000-000000000000','Temperature','tavg'),
  ('00000000-0000-0000-0000-000000000000','평균기온','tavg'),
  ('00000000-0000-0000-0000-000000000000','tavg','tavg'),
  ('00000000-0000-0000-0000-000000000000','기온','tavg'),
  ('00000000-0000-0000-0000-000000000000','온도','tavg'),
  
  -- 광고비 관련
  ('00000000-0000-0000-0000-000000000000','Spend','spend'),
  ('00000000-0000-0000-0000-000000000000','광고비','spend'),
  ('00000000-0000-0000-0000-000000000000','spend','spend'),
  ('00000000-0000-0000-0000-000000000000','마케팅비','spend'),
  
  -- 이벤트 관련
  ('00000000-0000-0000-0000-000000000000','Event','is_event'),
  ('00000000-0000-0000-0000-000000000000','이벤트','is_event'),
  ('00000000-0000-0000-0000-000000000000','is_event','is_event'),
  ('00000000-0000-0000-0000-000000000000','프로모션','is_event')
on conflict (tenant_id, alias) do nothing;

-- 3. RLS 정책 설정
alter table analytics.csv_header_map enable row level security;

-- 테넌트별 접근 허용
drop policy if exists csv_header_map_tenant_access on analytics.csv_header_map;
create policy csv_header_map_tenant_access on analytics.csv_header_map
  for all to authenticated
  using (tenant_id = analytics.current_tenant_id() or tenant_id = '00000000-0000-0000-0000-000000000000');

-- 서비스 역할 전체 접근
grant all on analytics.csv_header_map to service_role;

-- 4. 헤더 매핑 조회 함수
create or replace function analytics.get_header_mapping(
  p_tenant_id uuid,
  p_headers text[]
)
returns table(
  original_header text,
  canonical_header text
)
language plpgsql
security definer
as $$
begin
  return query
  with tenant_mappings as (
    select alias, canonical
    from analytics.csv_header_map
    where tenant_id = p_tenant_id
      and alias = any(p_headers)
  ),
  global_mappings as (
    select alias, canonical
    from analytics.csv_header_map
    where tenant_id = '00000000-0000-0000-0000-000000000000'
      and alias = any(p_headers)
      and alias not in (select alias from tenant_mappings)
  ),
  all_mappings as (
    select alias, canonical from tenant_mappings
    union all
    select alias, canonical from global_mappings
  )
  select 
    h as original_header,
    coalesce(am.canonical, h) as canonical_header
  from unnest(p_headers) as h
  left join all_mappings am on am.alias = h;
end;
$$;

grant execute on function analytics.get_header_mapping(uuid, text[]) to anon, authenticated, service_role;

-- 5. 스키마 리로드
select pg_notify('pgrst','reload schema');
