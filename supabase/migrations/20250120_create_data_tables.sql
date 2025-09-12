-- 날씨 데이터 테이블
CREATE TABLE IF NOT EXISTS weather_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    region VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity INTEGER,
    precipitation DECIMAL(5,2),
    description VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, region)
);

-- 광고 데이터 테이블
CREATE TABLE IF NOT EXISTS ads_data (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    channel VARCHAR(50) NOT NULL,
    campaign_id VARCHAR(100),
    impressions INTEGER,
    clicks INTEGER,
    spend DECIMAL(12,2),
    revenue DECIMAL(12,2),
    roas DECIMAL(5,2),
    ctr DECIMAL(5,4),
    cpc DECIMAL(8,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, channel, campaign_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_weather_data_date ON weather_data(date);
CREATE INDEX IF NOT EXISTS idx_weather_data_region ON weather_data(region);
CREATE INDEX IF NOT EXISTS idx_ads_data_date ON ads_data(date);
CREATE INDEX IF NOT EXISTS idx_ads_data_channel ON ads_data(channel);

-- RLS 정책 (필요시)
ALTER TABLE weather_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads_data ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "weather_data_read_policy" ON weather_data FOR SELECT USING (true);
CREATE POLICY "ads_data_read_policy" ON ads_data FOR SELECT USING (true);

-- 서비스 역할만 쓰기 가능
CREATE POLICY "weather_data_write_policy" ON weather_data FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "ads_data_write_policy" ON ads_data FOR ALL USING (auth.role() = 'service_role');
