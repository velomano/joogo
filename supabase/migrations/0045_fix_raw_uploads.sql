-- 0045_fix_raw_uploads.sql
set role postgres;

-- raw_uploads 테이블 완전 재생성
drop table if exists public.raw_uploads cascade;

create table public.raw_uploads (
  file_id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  path text not null,
  status text not null check (status in ('RECEIVED','PROCESSING','COMPLETED','FAILED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS 정책 설정
alter table public.raw_uploads enable row level security;
create policy "Service role can do everything" on public.raw_uploads 
  for all to service_role using (true) with check (true);

create policy "Users can view own tenant uploads" on public.raw_uploads 
  for all to authenticated using (tenant_id = coalesce(current_setting('app.tenant_id', true)::uuid, '00000000-0000-0000-0000-000000000001'));

-- 권한 부여
grant all on public.raw_uploads to service_role;
grant select on public.raw_uploads to anon, authenticated;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
