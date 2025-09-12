-- 크론 작업으로 수집된 데이터 저장용 스키마
-- 2025-01-01 생성

-- 1. 매출 데이터 테이블
CREATE TABLE IF NOT EXISTS sales_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    region VARCHAR(20) NOT NULL,
    channel VARCHAR(20) NOT NULL,
    category VARCHAR(20),
    sku VARCHAR(50),
    revenue BIGINT NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 0,
    roas DECIMAL(5,2),
    spend BIGINT,
    is_event BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    UNIQUE(date, region, channel, category, sku)
);

-- 2. 날씨 데이터 테이블
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    region VARCHAR(20) NOT NULL,
    tavg DECIMAL(4,1), -- 평균 기온
    tmin DECIMAL(4,1), -- 최저 기온
    tmax DECIMAL(4,1), -- 최고 기온
    humidity INTEGER,  -- 습도
    precipitation DECIMAL(5,2), -- 강수량
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    UNIQUE(date, region)
);

-- 3. 광고 데이터 테이블
CREATE TABLE IF NOT EXISTS ads_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    channel VARCHAR(20) NOT NULL,
    campaign VARCHAR(100),
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend BIGINT DEFAULT 0,
    revenue BIGINT DEFAULT 0,
    roas DECIMAL(5,2),
    ctr DECIMAL(5,2), -- 클릭률
    cpc DECIMAL(10,2), -- 클릭당 비용
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 인덱스
    UNIQUE(date, channel, campaign)
);

-- 4. 크론 작업 로그 테이블
CREATE TABLE IF NOT EXISTS cron_job_logs (
    id SERIAL PRIMARY KEY,
    job_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'running'
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_sales_data_date ON sales_data(date);
CREATE INDEX IF NOT EXISTS idx_sales_data_region ON sales_data(region);
CREATE INDEX IF NOT EXISTS idx_sales_data_channel ON sales_data(channel);
CREATE INDEX IF NOT EXISTS idx_sales_data_category ON sales_data(category);

CREATE INDEX IF NOT EXISTS idx_weather_data_date ON weather_data(date);
CREATE INDEX IF NOT EXISTS idx_weather_data_region ON weather_data(region);

CREATE INDEX IF NOT EXISTS idx_ads_data_date ON ads_data(date);
CREATE INDEX IF NOT EXISTS idx_ads_data_channel ON ads_data(channel);

CREATE INDEX IF NOT EXISTS idx_cron_job_logs_job_name ON cron_job_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_job_logs_started_at ON cron_job_logs(started_at);

-- RLS 정책 (필요시)
ALTER TABLE sales_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_job_logs ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Allow read access to sales_data" ON sales_data FOR SELECT USING (true);
CREATE POLICY "Allow read access to weather_data" ON weather_data FOR SELECT USING (true);
CREATE POLICY "Allow read access to ads_data" ON ads_data FOR SELECT USING (true);
CREATE POLICY "Allow read access to cron_job_logs" ON cron_job_logs FOR SELECT USING (true);

-- 서비스 역할만 쓰기 가능
CREATE POLICY "Allow service role to insert sales_data" ON sales_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert weather_data" ON weather_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert ads_data" ON ads_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role to insert cron_job_logs" ON cron_job_logs FOR INSERT WITH CHECK (true);
