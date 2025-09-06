-- 0043_create_tenants_table.sql
set role postgres;

-- tenants 테이블 생성
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 샘플 테넌트 데이터 삽입
insert into public.tenants (id, name) values 
  ('00000000-0000-0000-0000-000000000001', 'Joogo Test Company')
on conflict (id) do nothing;

-- RLS 정책 설정
alter table public.tenants enable row level security;
create policy "Users can view all tenants" on public.tenants for select using (true);

-- 권한 부여
grant all on public.tenants to service_role;
grant select on public.tenants to anon, authenticated;

select pg_notify('pgrst','reload schema');
