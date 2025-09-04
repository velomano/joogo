-- === 스키마 보강: stage_sales에 표준 컬럼 추가 ===

create schema if not exists analytics;

-- 어떤 배포 상태든 표준 컬럼이 없으면 추가 (idempotent)
alter table if exists analytics.stage_sales add column if not exists tenant_id uuid;
alter table if exists analytics.stage_sales add column if not exists file_id uuid;
alter table if exists analytics.stage_sales add column if not exists row_num int;

alter table if exists analytics.stage_sales add column if not exists sale_date date;
alter table if exists analytics.stage_sales add column if not exists region text;
alter table if exists analytics.stage_sales add column if not exists channel text;
alter table if exists analytics.stage_sales add column if not exists category text;
alter table if exists analytics.stage_sales add column if not exists sku text;

alter table if exists analytics.stage_sales add column if not exists qty numeric;
alter table if exists analytics.stage_sales add column if not exists revenue numeric;
alter table if exists analytics.stage_sales add column if not exists ad_cost numeric;
alter table if exists analytics.stage_sales add column if not exists discount_rate numeric;
alter table if exists analytics.stage_sales add column if not exists tavg numeric;

alter table if exists analytics.stage_sales add column if not exists original_data jsonb;

-- 혹시 과거 "date"/"spend"만 있을 때 보조 매핑
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema='analytics' and table_name='stage_sales' and column_name='date')
     and not exists (select 1 from information_schema.columns
                     where table_schema='analytics' and table_name='stage_sales' and column_name='sale_date') then
    alter table analytics.stage_sales add column sale_date date;
    update analytics.stage_sales set sale_date = "date" where sale_date is null;
  end if;

  if exists (select 1 from information_schema.columns
             where table_schema='analytics' and table_name='stage_sales' and column_name='spend')
     and not exists (select 1 from information_schema.columns
                     where table_schema='analytics' and table_name='stage_sales' and column_name='ad_cost') then
    alter table analytics.stage_sales add column ad_cost numeric;
    update analytics.stage_sales set ad_cost = nullif(spend,0)::numeric where ad_cost is null;
  end if;
end $$;

-- 빠른 점검
select column_name, data_type
from information_schema.columns
where table_schema='analytics' and table_name='stage_sales'
order by 1;
