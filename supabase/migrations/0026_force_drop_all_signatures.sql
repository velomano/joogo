-- 9단계: 모든 함수 시그니처로 완전 삭제

-- analytics 스키마 함수들 모든 시그니처로 삭제
drop function if exists analytics.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists analytics.board_top_skus(date, date, text[], text[], text[], text[]);

-- public 스키마 함수들 모든 시그니처로 삭제
drop function if exists public.board_sales_daily(date, date, text[], text[], text[], text[]);
drop function if exists public.board_roas_by_channel(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_categories(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_regions(date, date, text[], text[], text[], text[]);
drop function if exists public.board_top_skus(date, date, text[], text[], text[], text[]);

-- 기본 시그니처로도 삭제
drop function if exists public.board_sales_daily();
drop function if exists public.board_roas_by_channel();
drop function if exists public.board_top_categories();
drop function if exists public.board_top_regions();
drop function if exists public.board_top_skus();

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
