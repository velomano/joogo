-- E) 스모크 10줄 테스트

-- 1. 래퍼 노출/파라미터 이름 확인
select oid::regprocedure::text, proargnames
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='board_sales_daily';

-- 2. 실행 OK?
select * from public.board_sales_daily() limit 1;

-- 3. publication/replica identity 확인
select schemaname, tablename from pg_publication_tables where pubname='supabase_realtime';
select relname, relreplident
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='analytics' and relname in ('data_version','ingest_jobs');

-- 4. 강제 신호 → 화면 자동 갱신 확인
select analytics.bump_data_version('00000000-0000-0000-0000-000000000001');

-- 5. REST API 테스트용
-- POST /rest/v1/rpc/board_sales_daily
-- Body: {}
-- Headers: apikey: YOUR_ANON_KEY
