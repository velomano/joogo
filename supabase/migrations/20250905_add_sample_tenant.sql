-- supabase/migrations/20250905_add_sample_tenant.sql
-- 샘플 테넌트 추가

set role postgres;

-- 샘플 테넌트 삽입
insert into public.tenants (id, name, created_at) 
values (
  '00000000-0000-0000-0000-000000000001',
  'Joogo Test Company',
  now()
) 
on conflict (id) do nothing;

-- core.tenants에도 동일한 테넌트 추가 (동기화)
insert into core.tenants (id, name, created_at) 
values (
  '00000000-0000-0000-0000-000000000001',
  'Joogo Test Company',
  now()
) 
on conflict (id) do nothing;
