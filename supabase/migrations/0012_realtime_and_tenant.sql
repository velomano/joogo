-- 스키마/권한
create schema if not exists analytics;
grant usage on schema analytics to anon, authenticated, service_role;

-- current_tenant_id(): 오버라이드→JWT 클레임→(선택)매핑 순으로 탐색
create or replace function analytics.current_tenant_id()
returns uuid
language plpgsql
stable
security definer
as $$
declare
  t_txt text;
  j     jsonb;
  mapped uuid;
begin
  t_txt := current_setting('app.tenant_id', true);
  if t_txt is not null and t_txt <> '' then
    return t_txt::uuid;
  end if;

  j := nullif(current_setting('request.jwt.claims', true), '')::jsonb;
  if j ? 'tenant_id' then
    t_txt := j->>'tenant_id';
    if t_txt is not null and t_txt <> '' then
      return t_txt::uuid;
    end if;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'user_tenants' and c.relkind = 'r'
  ) then
    select ut.tenant_id into mapped
    from public.user_tenants ut
    where ut.user_id = auth.uid()
    limit 1;

    if mapped is not null then
      return mapped;
    end if;
  end if;

  return null;
end;
$$;
grant execute on function analytics.current_tenant_id() to anon, authenticated, service_role;

-- 서비스 키로 트랜잭션 내 테넌트 오버라이드
create or replace function public.set_local_tenant_id(p_tenant uuid)
returns void
language sql
security definer
as $$ select set_config('app.tenant_id', p_tenant::text, true); $$;
grant execute on function public.set_local_tenant_id(uuid) to service_role;

-- 버전 테이블
create table if not exists analytics.data_version (
  tenant_id  uuid primary key,
  v          bigint not null default 1,
  updated_at timestamptz not null default now()
);
alter table analytics.data_version enable row level security;
grant select on table analytics.data_version to authenticated;
grant insert, update on table analytics.data_version to service_role;
drop policy if exists data_version_sel on analytics.data_version;
create policy data_version_sel on analytics.data_version
for select to authenticated
using (tenant_id = analytics.current_tenant_id());
drop policy if exists data_version_ins_srv on analytics.data_version;
create policy data_version_ins_srv on analytics.data_version
for insert to service_role with check (true);
drop policy if exists data_version_upd_srv on analytics.data_version;
create policy data_version_upd_srv on analytics.data_version
for update to service_role using (true) with check (true);

-- 업로드 상태 테이블
create table if not exists analytics.ingest_jobs (
  tenant_id   uuid not null,
  file_id     uuid not null,
  status      text not null check (status in ('uploading','staging','merging','merged','failed')),
  rows_staged int  default 0,
  rows_merged int  default 0,
  message     text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  primary key (tenant_id, file_id)
);
alter table analytics.ingest_jobs enable row level security;
grant select on table analytics.ingest_jobs to authenticated;
grant insert, update on table analytics.ingest_jobs to service_role;
drop policy if exists ingest_jobs_sel on analytics.ingest_jobs;
create policy ingest_jobs_sel on analytics.ingest_jobs
for select to authenticated
using (tenant_id = analytics.current_tenant_id());
drop policy if exists ingest_jobs_ins_srv on analytics.ingest_jobs;
create policy ingest_jobs_ins_srv on analytics.ingest_jobs
for insert to service_role with check (true);
drop policy if exists ingest_jobs_upd_srv on analytics.ingest_jobs;
create policy ingest_jobs_upd_srv on analytics.ingest_jobs
for update to service_role using (true) with check (true);

-- 버전 증가 함수
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
end;
$$;
grant execute on function analytics.bump_data_version(uuid) to service_role;

-- Realtime 게시 등록(존재 검사 포함)
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    execute 'create publication supabase_realtime';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='analytics' and tablename='ingest_jobs'
  ) then
    execute 'alter publication supabase_realtime add table analytics.ingest_jobs';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='analytics' and tablename='data_version'
  ) then
    execute 'alter publication supabase_realtime add table analytics.data_version';
  end if;
end
$$;

-- 업데이트 전/후 레코드 송출 권장
alter table analytics.ingest_jobs  replica identity full;
alter table analytics.data_version replica identity full;

-- REST 스키마 리로드
select pg_notify('pgrst','reload schema');
