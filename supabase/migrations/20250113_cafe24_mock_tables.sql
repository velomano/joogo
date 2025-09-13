-- Cafe24 Mock 데이터 저장용 테이블 생성
-- 실제 Cafe24 API 구조에 맞춰 설계

-- 1. 매출 데이터 (Cafe24 Orders API 기준)
CREATE TABLE IF NOT EXISTS analytics.cafe24_orders (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_id VARCHAR(50) NOT NULL, -- Cafe24 주문번호
  order_date TIMESTAMP WITH TIME ZONE NOT NULL,
  order_status VARCHAR(20) NOT NULL, -- PAID, SHIPPED, DELIVERED, CANCELLED, REFUNDED
  customer_id VARCHAR(50),
  customer_name VARCHAR(100),
  customer_email VARCHAR(100),
  customer_phone VARCHAR(20),
  channel VARCHAR(20) NOT NULL, -- web, app, mobile, kiosk, offline
  region VARCHAR(20) NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  shipping_fee NUMERIC(10,2) DEFAULT 0,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  payment_method VARCHAR(20),
  shipping_address JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, order_id)
);

-- 2. 주문 상품 데이터 (Cafe24 Order Items API 기준)
CREATE TABLE IF NOT EXISTS analytics.cafe24_order_items (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  order_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL, -- Cafe24 상품 ID
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50), -- SKU
  option_code VARCHAR(50), -- 옵션 코드
  option_name VARCHAR(100), -- 옵션명 (색상, 사이즈 등)
  category VARCHAR(50),
  brand VARCHAR(50),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  discount_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (tenant_id, order_id) REFERENCES analytics.cafe24_orders(tenant_id, order_id)
);

-- 3. 광고 데이터 (Cafe24 Marketing API 기준)
CREATE TABLE IF NOT EXISTS analytics.cafe24_marketing (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  campaign_id VARCHAR(50) NOT NULL,
  campaign_name VARCHAR(100) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- google, facebook, naver, kakao 등
  ad_group_id VARCHAR(50),
  ad_group_name VARCHAR(100),
  keyword VARCHAR(100),
  target_audience VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE,
  budget NUMERIC(12,2),
  spend NUMERIC(12,2) NOT NULL,
  impressions BIGINT DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  revenue NUMERIC(12,2) DEFAULT 0,
  ctr NUMERIC(5,4) DEFAULT 0, -- Click Through Rate
  cpc NUMERIC(8,2) DEFAULT 0, -- Cost Per Click
  cpa NUMERIC(8,2) DEFAULT 0, -- Cost Per Acquisition
  roas NUMERIC(5,2) DEFAULT 0, -- Return on Ad Spend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, campaign_id, start_date)
);

-- 4. 상품 데이터 (Cafe24 Products API 기준)
CREATE TABLE IF NOT EXISTS analytics.cafe24_products (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  product_id VARCHAR(50) NOT NULL, -- Cafe24 상품 ID
  product_name VARCHAR(200) NOT NULL,
  product_code VARCHAR(50), -- SKU
  category VARCHAR(50),
  subcategory VARCHAR(50),
  brand VARCHAR(50),
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, DISCONTINUED
  price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  stock_quantity INTEGER DEFAULT 0,
  safety_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 7,
  weight NUMERIC(8,2),
  dimensions JSONB, -- {width, height, depth}
  images JSONB, -- 이미지 URL 배열
  options JSONB, -- 옵션 정보 (색상, 사이즈 등)
  tags JSONB, -- 태그 배열
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, product_id)
);

-- 5. 고객 데이터 (Cafe24 Customers API 기준)
CREATE TABLE IF NOT EXISTS analytics.cafe24_customers (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  gender VARCHAR(10),
  birth_date DATE,
  address JSONB,
  membership_level VARCHAR(20) DEFAULT 'BRONZE', -- BRONZE, SILVER, GOLD, PLATINUM
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(12,2) DEFAULT 0,
  last_order_date TIMESTAMP WITH TIME ZONE,
  registration_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, INACTIVE, BLOCKED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, customer_id)
);

-- 6. 날씨 데이터 (기존 weather_data 테이블 확장)
CREATE TABLE IF NOT EXISTS analytics.cafe24_weather (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL,
  date DATE NOT NULL,
  region VARCHAR(20) NOT NULL,
  temperature_avg NUMERIC(4,1),
  temperature_min NUMERIC(4,1),
  temperature_max NUMERIC(4,1),
  humidity INTEGER,
  precipitation NUMERIC(5,2),
  wind_speed NUMERIC(4,1),
  weather_condition VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(tenant_id, date, region)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_cafe24_orders_tenant_date ON analytics.cafe24_orders(tenant_id, order_date);
CREATE INDEX IF NOT EXISTS idx_cafe24_orders_status ON analytics.cafe24_orders(order_status);
CREATE INDEX IF NOT EXISTS idx_cafe24_orders_channel ON analytics.cafe24_orders(channel);
CREATE INDEX IF NOT EXISTS idx_cafe24_orders_region ON analytics.cafe24_orders(region);

CREATE INDEX IF NOT EXISTS idx_cafe24_order_items_tenant_order ON analytics.cafe24_order_items(tenant_id, order_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_order_items_product ON analytics.cafe24_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_order_items_category ON analytics.cafe24_order_items(category);

CREATE INDEX IF NOT EXISTS idx_cafe24_marketing_tenant_date ON analytics.cafe24_marketing(tenant_id, start_date);
CREATE INDEX IF NOT EXISTS idx_cafe24_marketing_channel ON analytics.cafe24_marketing(channel);
CREATE INDEX IF NOT EXISTS idx_cafe24_marketing_campaign ON analytics.cafe24_marketing(campaign_id);

CREATE INDEX IF NOT EXISTS idx_cafe24_products_tenant ON analytics.cafe24_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_products_category ON analytics.cafe24_products(category);
CREATE INDEX IF NOT EXISTS idx_cafe24_products_status ON analytics.cafe24_products(status);

CREATE INDEX IF NOT EXISTS idx_cafe24_customers_tenant ON analytics.cafe24_customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cafe24_customers_membership ON analytics.cafe24_customers(membership_level);

CREATE INDEX IF NOT EXISTS idx_cafe24_weather_tenant_date ON analytics.cafe24_weather(tenant_id, date);
CREATE INDEX IF NOT EXISTS idx_cafe24_weather_region ON analytics.cafe24_weather(region);

-- RLS 정책
ALTER TABLE analytics.cafe24_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cafe24_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cafe24_marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cafe24_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cafe24_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.cafe24_weather ENABLE ROW LEVEL SECURITY;

-- 모든 테이블에 대한 읽기 권한 부여
GRANT SELECT ON analytics.cafe24_orders TO anon, authenticated, service_role;
GRANT SELECT ON analytics.cafe24_order_items TO anon, authenticated, service_role;
GRANT SELECT ON analytics.cafe24_marketing TO anon, authenticated, service_role;
GRANT SELECT ON analytics.cafe24_products TO anon, authenticated, service_role;
GRANT SELECT ON analytics.cafe24_customers TO anon, authenticated, service_role;
GRANT SELECT ON analytics.cafe24_weather TO anon, authenticated, service_role;

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cafe24_orders_updated_at 
  BEFORE UPDATE ON analytics.cafe24_orders 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafe24_marketing_updated_at 
  BEFORE UPDATE ON analytics.cafe24_marketing 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafe24_products_updated_at 
  BEFORE UPDATE ON analytics.cafe24_products 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cafe24_customers_updated_at 
  BEFORE UPDATE ON analytics.cafe24_customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
