-- public 스키마에 필요한 테이블들 생성

-- 1. fact_sales 테이블 (판매 데이터)
CREATE TABLE IF NOT EXISTS public.fact_sales (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    sale_date DATE NOT NULL,
    region VARCHAR(50),
    channel VARCHAR(50),
    category VARCHAR(50),
    sku VARCHAR(100),
    product_name VARCHAR(255),
    color VARCHAR(50),
    size VARCHAR(50),
    qty INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    ad_cost DECIMAL(15,2) DEFAULT 0,
    discount_rate DECIMAL(5,2) DEFAULT 0,
    tavg DECIMAL(5,2) DEFAULT 20,
    source VARCHAR(50) DEFAULT 'cafe24',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ads_data 테이블 (광고 데이터)
CREATE TABLE IF NOT EXISTS public.ads_data (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    date DATE NOT NULL,
    channel VARCHAR(50),
    spend DECIMAL(15,2) DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    revenue DECIMAL(15,2) DEFAULT 0,
    roas DECIMAL(5,2) DEFAULT 0,
    ctr DECIMAL(5,2) DEFAULT 0,
    cpc DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. cafe24_products 테이블 (상품 데이터)
CREATE TABLE IF NOT EXISTS public.cafe24_products (
    id SERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    product_code VARCHAR(100) UNIQUE NOT NULL,
    product_name VARCHAR(255),
    category VARCHAR(50),
    color VARCHAR(50),
    size VARCHAR(50),
    stock_quantity INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    lead_time_days INTEGER DEFAULT 7,
    reorder_gap_days INTEGER DEFAULT 3,
    reorder_point INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_fact_sales_tenant_date ON public.fact_sales(tenant_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_fact_sales_sku ON public.fact_sales(sku);
CREATE INDEX IF NOT EXISTS idx_ads_data_tenant_date ON public.ads_data(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_cafe24_products_tenant ON public.cafe24_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_products_code ON public.cafe24_products(product_code);

-- RLS 정책 설정
ALTER TABLE public.fact_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cafe24_products ENABLE ROW LEVEL SECURITY;

-- 테넌트별 접근 정책
CREATE POLICY "Users can access their own data" ON public.fact_sales
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Users can access their own data" ON public.ads_data
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY "Users can access their own data" ON public.cafe24_products
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
