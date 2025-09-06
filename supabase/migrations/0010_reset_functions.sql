-- 강력한 리셋 함수들 (락 사용, 경쟁 상태 방지)
set role postgres;

-- 테넌트 락(경쟁 상태 방지)
create or replace function analytics.with_tenant_lock(p_tenant uuid, action text)
returns void language plpgsql as $$
begin
  perform pg_advisory_xact_lock(hashtext('tenant-reset:'||p_tenant::text));
end $$;

-- 파일 단위 리셋
create or replace function analytics.reset_file(
  p_tenant_id uuid,
  p_file_id uuid
) returns table(stage_deleted bigint, fact_deleted bigint)
language plpgsql
security definer
as $$
declare s bigint := 0; f bigint := 0;
begin
  perform analytics.with_tenant_lock(p_tenant_id, 'file');
  delete from analytics.fact_sales  where tenant_id=p_tenant_id and file_id=p_file_id;  
  get diagnostics f = row_count;
  delete from analytics.stage_sales where tenant_id=p_tenant_id and file_id=p_file_id;  
  get diagnostics s = row_count;
  return query select s, f;
end $$;

-- 테넌트 전체 리셋 (모든 테이블 포함)
create or replace function analytics.reset_tenant(
  p_tenant_id uuid
) returns table(stage_deleted bigint, fact_deleted bigint, items_deleted bigint, uploads_deleted bigint, jobs_deleted bigint)
language plpgsql
security definer
as $$
declare s bigint := 0; f bigint := 0; i bigint := 0; u bigint := 0; j bigint := 0;
        temp_count bigint;
begin
  perform analytics.with_tenant_lock(p_tenant_id, 'tenant');
  
  -- analytics.fact_sales 삭제 (직접 tenant_id)
  delete from analytics.fact_sales where tenant_id=p_tenant_id;  
  get diagnostics f = row_count;
  
  -- analytics.fact_sales 삭제 (original_data JSONB 내 tenant_id)
  delete from analytics.fact_sales where original_data->>'tenant_id' = p_tenant_id::text;
  get diagnostics temp_count = row_count;
  f := f + temp_count;
  
  -- analytics.stage_sales 삭제
  delete from analytics.stage_sales where tenant_id=p_tenant_id::text;  
  get diagnostics s = row_count;
  
  -- public.items 삭제
  delete from public.items where tenant_id=p_tenant_id;  
  get diagnostics i = row_count;
  
  -- analytics.raw_uploads 삭제
  delete from analytics.raw_uploads where tenant_id=p_tenant_id;  
  get diagnostics u = row_count;
  
  -- analytics.ingest_jobs 삭제 (tenant_id가 text인 경우)
  delete from analytics.ingest_jobs where tenant_id=p_tenant_id::text;  
  get diagnostics j = row_count;
  
  return query select s, f, i, u, j;
end $$;

-- 공개 래퍼(REST에서 호출용, security definer로 실행)
create or replace function public.reset_file(p_tenant_id uuid, p_file_id uuid)
returns table(stage_deleted bigint, fact_deleted bigint)
language sql security definer stable
as $$ select * from analytics.reset_file(p_tenant_id, p_file_id) $$;

create or replace function public.reset_tenant(p_tenant_id uuid)
returns table(stage_deleted bigint, fact_deleted bigint, items_deleted bigint, uploads_deleted bigint, jobs_deleted bigint)
language sql security definer stable
as $$ select * from analytics.reset_tenant(p_tenant_id) $$;

-- 권한 부여
grant execute on function public.reset_file(uuid,uuid)   to service_role;
grant execute on function public.reset_tenant(uuid)      to service_role;

-- PostgREST 스키마 캐시 즉시 리로드
notify pgrst, 'reload schema';
