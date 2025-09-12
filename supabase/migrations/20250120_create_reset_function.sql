-- 리셋 함수 생성
create or replace function public.board_reset_tenant_data(
  p_tenant_id uuid,
  p_hard boolean default true
)
returns json
language plpgsql
security definer
set search_path = public, analytics
as $$
declare
  fact_deleted integer := 0;
  stage_deleted integer := 0;
  total_deleted integer := 0;
begin
  -- fact_sales 테이블에서 해당 테넌트 데이터 삭제
  delete from analytics.fact_sales where tenant_id = p_tenant_id;
  get diagnostics fact_deleted = row_count;
  
  -- stage_sales 테이블에서 해당 테넌트 데이터 삭제
  delete from analytics.stage_sales where tenant_id = p_tenant_id;
  get diagnostics stage_deleted = row_count;
  
  total_deleted := fact_deleted + stage_deleted;
  
  -- 하드 리셋이면 더 강하게
  if p_hard then
    -- 시퀀스 리셋 등 추가 작업
    perform setval('analytics.fact_sales_id_seq', 1, false);
    
    -- 관련 테이블들도 정리 (필요시)
    -- delete from analytics.dim_products where tenant_id = p_tenant_id;
    -- delete from analytics.dim_regions where tenant_id = p_tenant_id;
  end if;
  
  -- 결과 반환
  return json_build_object(
    'ok', true,
    'tenant_id', p_tenant_id,
    'hard', p_hard,
    'fact_deleted', fact_deleted,
    'stage_deleted', stage_deleted,
    'total_deleted', total_deleted,
    'message', '데이터 리셋이 완료되었습니다.'
  );
end;
$$;

-- 권한 부여
grant execute on function public.board_reset_tenant_data(uuid, boolean)
  to anon, authenticated, service_role;

-- PostgREST 스키마 캐시 리로드
select pg_notify('pgrst', 'reload schema');
