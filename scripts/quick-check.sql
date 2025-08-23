-- 최신 파일 상태 확인
select * from analytics.raw_uploads order by received_at desc limit 5;

-- 스테이징 카운트
select file_id, count(*) as rows from analytics.stage_sales
group by 1 order by rows desc limit 5;

-- 사실 테이블 최근 7일
select sales_date, sku, sum(qty) qty, sum(revenue) revenue
from analytics.fact_sales
where tenant_id = :tenant_id and sales_date >= current_date - 7
group by 1,2 order by 1 desc, 3 desc;

-- 요일별
select dow, sum(qty) qty, sum(revenue) revenue
from analytics.fact_sales
where tenant_id = :tenant_id and sales_date >= current_date - 30
group by 1 order by 1;


