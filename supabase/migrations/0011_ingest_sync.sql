-- 0011_ingest_sync.sql
set role postgres;

-- 1) 업로드/머지 진행상태 테이블 (Realtime 구독용)
create table if not exists analytics.ingest_jobs (
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

alter table analytics.ingest_jobs
  enable row level security;

drop policy if exists ingest_jobs_tenant_sel on analytics.ingest_jobs;
create policy ingest_jobs_tenant_sel
on analytics.ingest_jobs
for select
to authenticated
using (tenant_id = analytics.current_tenant_id());

drop policy if exists ingest_jobs_tenant_ins on analytics.ingest_jobs;
create policy ingest_jobs_tenant_ins
on analytics.ingest_jobs
for insert
to service_role
with check (true);

drop policy if exists ingest_jobs_tenant_upd on analytics.ingest_jobs;
create policy ingest_jobs_tenant_upd
on analytics.ingest_jobs
for update
to service_role
using (true)
with check (true);

-- Realtime 전송을 위해 REPLICA IDENTITY FULL 권장
alter table analytics.ingest_jobs replica identity full;

-- 2) 테넌트 버전 테이블 (증분 카운터)
create table if not exists analytics.data_version (
  tenant_id uuid primary key,
  v bigint not null default 1,
  updated_at timestamptz default now()
);

alter table analytics.data_version enable row level security;

drop policy if exists data_version_sel on analytics.data_version;
create policy data_version_sel
on analytics.data_version
for select
to authenticated
using (tenant_id = analytics.current_tenant_id());

-- service_role만 갱신
drop policy if exists data_version_upd on analytics.data_version;
create policy data_version_upd
on analytics.data_version
for insert
to service_role
with check (true);

create policy data_version_upd2
on analytics.data_version
for update
to service_role
using (true)
with check (true);

-- 3) 버전 증가 함수
create or replace function analytics.bump_data_version(p_tenant uuid)
returns bigint
language plpgsql
security definer
as $$
declare newv bigint;
begin
  insert into analytics.data_version(tenant_id, v)
  values (p_tenant, 1)
  on conflict (tenant_id) do update
  set v = analytics.data_version.v + 1,
      updated_at = now()
  returning v into newv;
  return newv;
end $$;

grant execute on function analytics.bump_data_version(uuid) to service_role;

-- 4) merge 함수 내에서 마지막에 버전 증가 + ingest_jobs 갱신 호출
-- board_merge_file 함수 수정
create or replace function public.board_merge_file(p_tenant_id uuid, p_file_id uuid)
returns table(rows_merged bigint)
language plpgsql
security definer
as $$
declare
  v_rows_merged bigint := 0;
begin
  -- 기존 merge 로직
  with merged as (
    insert into analytics.fact_sales (
      tenant_id, file_id, sale_date, region, channel, category, sku, 
      qty, revenue, ad_cost, discount_rate, tavg, original_data
    )
    select 
      tenant_id, file_id, sale_date, region, channel, category, sku,
      qty, revenue, ad_cost, discount_rate, tavg, original_data
    from analytics.stage_sales
    where tenant_id = p_tenant_id and file_id = p_file_id
    on conflict (tenant_id, file_id, sale_date, region, channel, category, sku)
    do update set
      qty = excluded.qty,
      revenue = excluded.revenue,
      ad_cost = excluded.ad_cost,
      discount_rate = excluded.discount_rate,
      tavg = excluded.tavg,
      original_data = excluded.original_data
    returning 1
  )
  select count(*) into v_rows_merged from merged;
  
  -- stage_sales 정리
  delete from analytics.stage_sales 
  where tenant_id = p_tenant_id and file_id = p_file_id;
  
  -- 버전 증가
  perform analytics.bump_data_version(p_tenant_id);
  
  -- ingest_jobs 상태 업데이트
  update analytics.ingest_jobs 
  set status = 'merged', 
      rows_merged = v_rows_merged, 
      updated_at = now() 
  where tenant_id = p_tenant_id and file_id = p_file_id;
  
  return query select v_rows_merged;
end $$;

-- PostgREST 캐시 리로드
notify pgrst, 'reload schema';
