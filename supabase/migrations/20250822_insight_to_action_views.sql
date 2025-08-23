-- Insight-to-Action에 필요한 뷰들 생성

-- 1. ABC 분석 뷰 (최근 30일 판매량 기준)
CREATE OR REPLACE VIEW fact.v_abc_recent30 AS
WITH sales_summary AS (
  SELECT 
    barcode as sku_id,
    SUM(qty) as qty_30d,
    ROW_NUMBER() OVER (ORDER BY SUM(qty) DESC) as rn,
    COUNT(*) as total_rows
  FROM fact.sales_daily 
  WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY barcode
),
abc_classified AS (
  SELECT 
    sku_id,
    qty_30d,
    CASE 
      WHEN rn <= ROUND(total_rows * 0.8) THEN 'A'
      WHEN rn <= ROUND(total_rows * 0.95) THEN 'B'
      ELSE 'C'
    END as abc_class
  FROM sales_summary
)
SELECT 
  '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' as tenant_id,
  sku_id,
  qty_30d,
  abc_class
FROM abc_classified;

-- 2. 수요 예측 기본 뷰 (56일 평균 및 표준편차)
CREATE OR REPLACE VIEW ml.v_demand_basics AS
WITH daily_demand AS (
  SELECT 
    barcode as sku_id,
    sale_date,
    qty
  FROM fact.sales_daily 
  WHERE sale_date >= CURRENT_DATE - INTERVAL '56 days'
),
demand_stats AS (
  SELECT 
    sku_id,
    AVG(qty) as d_hat_56,
    STDDEV(qty) as sigma_56
  FROM daily_demand
  GROUP BY sku_id
)
SELECT 
  '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' as tenant_id,
  sku_id,
  COALESCE(d_hat_56, 0) as d_hat_56,
  COALESCE(sigma_56, 0) as sigma_56
FROM demand_stats;

-- 3. 90일 비활성 상품 뷰
CREATE OR REPLACE VIEW fact.v_inactive_90 AS
WITH last_sales AS (
  SELECT 
    barcode as sku_id,
    MAX(sale_date) as last_sale_date
  FROM fact.sales_daily
  GROUP BY barcode
),
inactive_items AS (
  SELECT 
    i.barcode as sku_id,
    i.qty as on_hand,
    ls.last_sale_date
  FROM fact.items i
  LEFT JOIN last_sales ls ON i.barcode = ls.sku_id
  WHERE ls.last_sale_date IS NULL 
     OR ls.last_sale_date < CURRENT_DATE - INTERVAL '90 days'
)
SELECT 
  '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' as tenant_id,
  sku_id,
  on_hand,
  last_sale_date
FROM inactive_items;

-- 4. 재고 스냅샷 뷰 (기존 테이블과 동일)
CREATE OR REPLACE VIEW fact.inventory_snapshot AS
SELECT 
  '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' as tenant_id,
  barcode as sku_id,
  sale_date as snapshot_date,
  qty as on_hand
FROM fact.items
WHERE channel = 'snapshot';

-- 5. 일별 판매 뷰 (기존 테이블과 동일)
CREATE OR REPLACE VIEW fact.sales_daily AS
SELECT 
  '84949b3c-2cb7-4c42-b9f9-d1f37d371e00' as tenant_id,
  barcode as sku_id,
  sale_date,
  qty,
  unit_price_krw,
  revenue_krw,
  channel
FROM fact.sales
WHERE sale_qty > 0;



