-- 테스트 데이터 삽입 SQL

-- 날씨 데이터 테스트
INSERT INTO weather_data (date, region, temperature, humidity, precipitation, description) 
VALUES 
('2025-01-01', 'SEOUL', 15.5, 65, 0, '맑음'),
('2025-01-02', 'SEOUL', 18.2, 70, 2.5, '비'),
('2025-01-03', 'SEOUL', 12.8, 55, 0, '맑음')
ON CONFLICT (date, region) DO UPDATE SET
  temperature = EXCLUDED.temperature,
  humidity = EXCLUDED.humidity,
  precipitation = EXCLUDED.precipitation,
  description = EXCLUDED.description;

-- 광고 데이터 테스트
INSERT INTO ads_data (date, channel, campaign_id, impressions, clicks, spend, revenue, roas, ctr, cpc)
VALUES 
('2025-01-01', 'google', 'CAMP-001', 10000, 200, 500000, 1000000, 2.0, 2.0, 2500),
('2025-01-02', 'facebook', 'CAMP-002', 15000, 300, 750000, 1500000, 2.0, 2.0, 2500),
('2025-01-03', 'naver', 'CAMP-003', 8000, 160, 400000, 800000, 2.0, 2.0, 2500)
ON CONFLICT (date, channel, campaign_id) DO UPDATE SET
  impressions = EXCLUDED.impressions,
  clicks = EXCLUDED.clicks,
  spend = EXCLUDED.spend,
  revenue = EXCLUDED.revenue,
  roas = EXCLUDED.roas,
  ctr = EXCLUDED.ctr,
  cpc = EXCLUDED.cpc;

-- 매출 데이터 테스트
INSERT INTO sales_data (date, region, channel, category, sku, revenue, quantity, roas, spend, is_event)
VALUES 
('2025-01-01', 'SEOUL', 'web', 'TOPS', 'TOPS-001', 1000000, 20, 2.0, 500000, false),
('2025-01-02', 'SEOUL', 'app', 'BOTTOMS', 'BOTTOMS-002', 1500000, 30, 2.5, 600000, true),
('2025-01-03', 'SEOUL', 'mobile', 'OUTER', 'OUTER-003', 800000, 16, 1.8, 450000, false)
ON CONFLICT (date, region, channel, category, sku) DO UPDATE SET
  revenue = EXCLUDED.revenue,
  quantity = EXCLUDED.quantity,
  roas = EXCLUDED.roas,
  spend = EXCLUDED.spend,
  is_event = EXCLUDED.is_event;
