-- 리셋 함수 생성
create or replace function public.board_reset_tenant_data(
  p_tenant_id uuid,
  p_hard boolean default true
)
returns void
language plpgsql
security definer
set search_path = public, analytics
as $$
begin
  -- 테넌트 데이터 정리
  delete from analytics.fact_sales where tenant_id = p_tenant_id;
  delete from analytics.stage_sales where tenant_id = p_tenant_id;
  
  -- 하드 리셋이면 더 강하게
  if p_hard then
    -- 시퀀스 리셋 등 추가 작업
    perform setval('analytics.fact_sales_id_seq', 1, false);
  end if;
end;
$$;

-- 권한 부여
grant execute on function public.board_reset_tenant_data(uuid, boolean)
  to anon, authenticated, service_role;

-- PostgREST 스키마 캐시 리로드
select pg_notify('pgrst', 'reload schema');
