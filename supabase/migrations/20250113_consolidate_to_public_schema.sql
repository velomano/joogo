-- public 스키마로 통합하는 마이그레이션

-- 1. analytics 스키마의 모든 테이블 삭제
DROP SCHEMA IF EXISTS analytics CASCADE;

-- 2. public.sales_data 삭제 (중복)
DROP TABLE IF EXISTS public.sales_data CASCADE;

-- 3. public.fact_sales 테이블 생성 (완전한 구조)
CREATE TABLE IF NOT EXISTS public.fact_sales (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  sale_date DATE NOT NULL,
  region TEXT,
  channel TEXT,
  category TEXT,
  sku TEXT,
  product_name TEXT,
  color TEXT,
  size TEXT,
  qty NUMERIC,
  revenue NUMERIC,
  ad_cost NUMERIC,
  discount_rate NUMERIC,
  tavg NUMERIC,
  file_id UUID,
  row_num INT,
  original_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_date ON public.fact_sales(tenant_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_channel ON public.fact_sales(tenant_id, channel);
CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_sku ON public.fact_sales(tenant_id, sku);
CREATE INDEX IF NOT EXISTS idx_fact_sales_original_gin ON public.fact_sales USING GIN(original_data);

-- 5. RLS 설정
ALTER TABLE public.fact_sales ENABLE ROW LEVEL SECURITY;

-- 6. 권한 설정
GRANT SELECT ON public.fact_sales TO anon, authenticated, service_role;
