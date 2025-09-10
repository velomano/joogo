-- 시드 데이터 추가 (화면 정상동작 확인용)

-- 기존 데이터 삭제 (리셋 후)
delete from analytics.fact_sales where tenant_id = '00000000-0000-0000-0000-000000000001';

-- 시드 데이터 3줄 추가
insert into analytics.fact_sales
(tenant_id, sale_date, sku, category, region, channel, revenue, qty)
values
('00000000-0000-0000-0000-000000000001','2025-01-05','SKU-1','CatA','KR','Online', 50000, 5),
('00000000-0000-0000-0000-000000000001','2025-01-06','SKU-1','CatA','KR','Online', 30000, 3),
('00000000-0000-0000-0000-000000000001','2025-01-07','SKU-2','CatB','KR','Retail', 40000, 4);
