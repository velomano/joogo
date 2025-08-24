-- 판매 분석 데이터를 위한 새로운 스키마
-- 기존 core.items와 별도로 운영

-- 1. 상품 기본 정보 테이블
CREATE TABLE IF NOT EXISTS core.products (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  상품코드 TEXT NOT NULL,
  상품명 TEXT NOT NULL,
  상품등록일자 TIMESTAMP,
  공급처명 TEXT,
  공급처코드 TEXT,
  공급처전화번호 TEXT,
  공급처위치 TEXT,
  사입상품명 TEXT,
  상품분류 TEXT,
  옵션일련번호 TEXT,
  옵션내용 TEXT,
  원가 DECIMAL(10,2),
  판매가 DECIMAL(10,2),
  옵션코드 TEXT,
  상품위치 TEXT,
  바코드번호 TEXT,
  품절여부 TEXT,
  안정재고 INTEGER,
  현재고 INTEGER,
  주문금액 DECIMAL(12,2),
  주문수 INTEGER,
  발송수 INTEGER,
  발송금액 DECIMAL(12,2),
  미발송수 INTEGER,
  입고수량 INTEGER,
  출고수량 INTEGER,
  부족수량 INTEGER,
  사입옵션명 TEXT,
  상품설명 TEXT,
  옵션별공급처 TEXT,
  옵션비고 TEXT,
  주문단가 DECIMAL(10,2),
  취소주문수 INTEGER,
  판매가X출고수량 DECIMAL(12,2),
  반품주문수 INTEGER,
  상품메모 TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- 인덱스
  UNIQUE(tenant_id, 상품코드, 옵션코드)
);

-- 2. 일별 판매 데이터 테이블 (정규화)
CREATE TABLE IF NOT EXISTS core.daily_sales (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES core.products(id) ON DELETE CASCADE,
  tenant_id TEXT NOT NULL,
  date DATE NOT NULL,
  daily_qty INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 인덱스
  UNIQUE(product_id, date),
  INDEX idx_daily_sales_tenant_date (tenant_id, date),
  INDEX idx_daily_sales_date (date)
);

-- 3. 기존 core.items 테이블과의 매핑 테이블
CREATE TABLE IF NOT EXISTS core.product_mapping (
  id SERIAL PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  old_sku TEXT, -- 기존 core.items의 sku
  new_product_id INTEGER REFERENCES core.products(id),
  mapping_type TEXT DEFAULT 'auto', -- 'auto', 'manual'
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- 인덱스
  UNIQUE(tenant_id, old_sku),
  INDEX idx_product_mapping_old_sku (old_sku)
);

-- 4. RLS 정책 설정
ALTER TABLE core.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.daily_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.product_mapping ENABLE ROW LEVEL SECURITY;

-- products 테이블 RLS 정책
CREATE POLICY "products_tenant_isolation" ON core.products
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- daily_sales 테이블 RLS 정책
CREATE POLICY "daily_sales_tenant_isolation" ON core.daily_sales
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- product_mapping 테이블 RLS 정책
CREATE POLICY "product_mapping_tenant_isolation" ON core.product_mapping
  FOR ALL USING (tenant_id = current_setting('app.tenant_id', true)::text);

-- 5. 뷰 생성 (기존 시스템과의 호환성)
CREATE OR REPLACE VIEW core.products_summary AS
SELECT 
  p.id,
  p.tenant_id,
  p.상품코드 as sku,
  p.상품명 as product_name,
  p.현재고 as qty,
  p.판매가 as price,
  p.원가 as cost,
  p.상품분류 as category,
  p.옵션내용 as option_detail,
  p.품절여부 as out_of_stock,
  p.created_at,
  p.updated_at
FROM core.products p;

-- 6. 함수 생성
CREATE OR REPLACE FUNCTION core.upsert_product(
  p_tenant_id TEXT,
  p_상품코드 TEXT,
  p_옵션코드 TEXT,
  p_data JSONB
) RETURNS INTEGER AS $$
DECLARE
  v_product_id INTEGER;
BEGIN
  -- 기존 상품 확인
  SELECT id INTO v_product_id 
  FROM core.products 
  WHERE tenant_id = p_tenant_id 
    AND 상품코드 = p_상품코드 
    AND 옵션코드 = p_옵션코드;
  
  IF v_product_id IS NOT NULL THEN
    -- 업데이트
    UPDATE core.products 
    SET 
      상품명 = p_data->>'상품명',
      상품등록일자 = (p_data->>'상품등록일자')::TIMESTAMP,
      공급처명 = p_data->>'공급처명',
      원가 = (p_data->>'원가')::DECIMAL,
      판매가 = (p_data->>'판매가')::DECIMAL,
      현재고 = (p_data->>'현재고')::INTEGER,
      주문수 = (p_data->>'주문수')::INTEGER,
      발송수 = (p_data->>'발송수')::INTEGER,
      updated_at = NOW()
    WHERE id = v_product_id;
  ELSE
    -- 새로 생성
    INSERT INTO core.products (
      tenant_id, 상품코드, 옵션코드, 상품명, 상품등록일자,
      공급처명, 원가, 판매가, 현재고, 주문수, 발송수
    ) VALUES (
      p_tenant_id, p_상품코드, p_옵션코드, p_data->>'상품명',
      (p_data->>'상품등록일자')::TIMESTAMP, p_data->>'공급처명',
      (p_data->>'원가')::DECIMAL, (p_data->>'판매가')::DECIMAL,
      (p_data->>'현재고')::INTEGER, (p_data->>'주문수')::INTEGER,
      (p_data->>'발송수')::INTEGER
    ) RETURNING id INTO v_product_id;
  END IF;
  
  RETURN v_product_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 일별 데이터 업데이트 함수
CREATE OR REPLACE FUNCTION core.update_daily_sales(
  p_product_id INTEGER,
  p_tenant_id TEXT,
  p_date DATE,
  p_qty INTEGER
) RETURNS VOID AS $$
BEGIN
  INSERT INTO core.daily_sales (product_id, tenant_id, date, daily_qty)
  VALUES (p_product_id, p_tenant_id, p_date, p_qty)
  ON CONFLICT (product_id, date) 
  DO UPDATE SET daily_qty = p_qty, updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 통계 뷰 생성
CREATE OR REPLACE VIEW core.sales_analytics AS
SELECT 
  p.tenant_id,
  p.상품코드,
  p.상품명,
  p.상품분류,
  p.현재고,
  p.주문수,
  p.발송수,
  p.판매가,
  p.원가,
  (p.판매가 - p.원가) as 마진,
  CASE 
    WHEN p.현재고 <= 0 THEN '품절'
    WHEN p.현재고 <= p.안정재고 THEN '부족'
    ELSE '충분'
  END as 재고상태,
  p.created_at,
  p.updated_at
FROM core.products p
ORDER BY p.주문수 DESC, p.현재고 ASC;








