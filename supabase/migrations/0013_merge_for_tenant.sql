create or replace function public.merge_for_tenant(p_tenant uuid, p_file uuid)
returns void
language plpgsql
security definer
as $$
begin
  perform public.set_local_tenant_id(p_tenant);
  -- 실제 머지 함수명/시그니처에 맞게 교체
  perform analytics.merge_stage_to_fact(p_tenant, p_file);

  -- 머지 내부에 bump/update가 없다면 보강
  perform analytics.bump_data_version(p_tenant);
  update analytics.ingest_jobs
     set status='merged',
         rows_merged = (select count(*) from analytics.fact_sales where tenant_id=p_tenant and file_id=p_file),
         updated_at = now()
   where tenant_id=p_tenant and file_id=p_file;
end;
$$;
grant execute on function public.merge_for_tenant(uuid,uuid) to service_role;

select pg_notify('pgrst','reload schema');
