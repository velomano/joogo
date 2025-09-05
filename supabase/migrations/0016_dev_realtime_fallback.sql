-- DEV ONLY: 익명도 읽기 허용 + 테넌트 강제(coalesce)
grant select on table analytics.ingest_jobs  to anon;
grant select on table analytics.data_version to anon;

drop policy if exists ingest_jobs_sel  on analytics.ingest_jobs;
drop policy if exists data_version_sel on analytics.data_version;

create policy ingest_jobs_sel on analytics.ingest_jobs
for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'::uuid));

create policy data_version_sel on analytics.data_version
for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'::uuid));

select pg_notify('pgrst','reload schema');
