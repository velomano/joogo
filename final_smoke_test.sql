-- 최종 스모크 테스트

-- 1. 테이블 존재 확인
select table_name from information_schema.tables 
where table_schema = 'public' and table_name = 'sales';

-- 2. RPC 함수 존재 확인
select routine_name from information_schema.routines 
where routine_schema = 'public' and routine_name = 'board_sales_daily';

-- 3. RPC 함수 실행 테스트
select * from public.board_sales_daily() limit 1;

-- 4. 데이터 확인
select count(*) as sales_count from public.sales;

-- 5. 강제 버전 업데이트
select analytics.bump_data_version('00000000-0000-0000-0000-000000000001');
