-- 4단계: 모든 중복 함수들 완전 삭제

-- analytics 스키마 함수들 모두 삭제
drop function if exists analytics.board_roas_by_channel_45693;
drop function if exists analytics.board_sales_daily_45692;
drop function if exists analytics.board_top_categories_45694;
drop function if exists analytics.board_top_regions_45695;
drop function if exists analytics.board_top_skus_45696;

-- public 스키마 중복 함수들 모두 삭제 (최신 것만 남기고)
drop function if exists public.board_roas_by_channel_42334;
drop function if exists public.board_roas_by_channel_45419;
drop function if exists public.board_roas_by_channel_45210;
drop function if exists public.board_sales_daily_45418;
drop function if exists public.board_top_categories_42335;
drop function if exists public.board_top_categories_45420;
drop function if exists public.board_top_categories_45211;
drop function if exists public.board_top_regions_42336;
drop function if exists public.board_top_regions_45212;
drop function if exists public.board_top_regions_45421;
drop function if exists public.board_top_skus_42250;
drop function if exists public.board_top_skus_45422;
drop function if exists public.board_top_skus_45213;

-- 스키마 리로드
select pg_notify('pgrst','reload schema');
