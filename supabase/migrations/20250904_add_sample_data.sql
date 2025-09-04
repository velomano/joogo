-- Add sample data for testing
-- This migration adds sample data to analytics.fact_sales for testing purposes

-- First, ensure the table exists with all required columns matching the actual CSV structure
create table if not exists analytics.fact_sales (
  tenant_id uuid not null,
  sale_date date not null,
  sku text,
  category text,
  region text,
  channel text,
  qty numeric default 0,
  revenue numeric default 0,
  ad_cost numeric default 0,
  tavg numeric default 0,
  tmax numeric default 0,
  tmin numeric default 0,
  precipitati numeric default 0,
  spend numeric default 0,
  clicks_mkt numeric default 0,
  impr_mkt numeric default 0,
  section text,
  slot_rank numeric default 0,
  impr_merc numeric default 0,
  clicks_mer numeric default 0,
  campaign text,
  platform text,
  is_event numeric default 0,
  stock_on_hand numeric default 0,
  lead_time_days numeric default 0,
  segment text,
  unit_price numeric default 0,
  discount_r numeric default 0,
  unit_cost numeric default 0
);

-- Insert sample data for the test tenant matching the actual table structure
insert into analytics.fact_sales (
  tenant_id, sale_date, sku, category, region, channel, qty, revenue, ad_cost, tavg, discount_rate
)
values 
  -- January 2025 data
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-001', 'Outer', 'SEOUL', 'web', 7, 199500, 10000, 2.0, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-002', 'Inner', 'SEOUL', 'app', 8, 281200, 8000, 2.0, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-003', 'Kids', 'BUSAN', 'web', 12, 501600, 12000, 2.0, 0.05),
  
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-02', 'SKU-001', 'Outer', 'SEOUL', 'web', 15, 726750, 15000, 2.7, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-02', 'SKU-002', 'Inner', 'SEOUL', 'app', 8, 281200, 8000, 2.7, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-02', 'SKU-003', 'Kids', 'BUSAN', 'web', 12, 501600, 12000, 2.7, 0.05),
  
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-03', 'SKU-001', 'Outer', 'SEOUL', 'web', 11, 313500, 11000, 0.5, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-03', 'SKU-002', 'Inner', 'SEOUL', 'app', 8, 281200, 8000, 0.5, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-03', 'SKU-003', 'Kids', 'BUSAN', 'web', 12, 501600, 12000, 0.5, 0.05),
  
  -- February 2025 data
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-02-01', 'SKU-001', 'Outer', 'SEOUL', 'web', 15, 726750, 15000, 3.4, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-02-01', 'SKU-002', 'Inner', 'SEOUL', 'app', 8, 281200, 8000, 3.4, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-02-01', 'SKU-003', 'Kids', 'BUSAN', 'web', 12, 501600, 12000, 3.4, 0.05),
  
  -- March 2025 data
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-03-01', 'SKU-001', 'Outer', 'SEOUL', 'web', 15, 726750, 15000, 1.4, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-03-01', 'SKU-002', 'Inner', 'SEOUL', 'app', 8, 281200, 8000, 1.4, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-03-01', 'SKU-003', 'Kids', 'BUSAN', 'web', 12, 501600, 12000, 1.4, 0.05),
  
  -- Additional SKUs for ABC analysis
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-004', 'Outer', 'SEOUL', 'web', 5, 142500, 5000, 2.0, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-005', 'Inner', 'SEOUL', 'app', 3, 105450, 3000, 2.0, 0.05),
  ('84949b3c-2cb7-4c42-b9f9-d1f37d371e00', '2025-01-01', 'SKU-006', 'Kids', 'BUSAN', 'web', 2, 83600, 2000, 2.0, 0.05)
on conflict (tenant_id, sale_date, sku) do nothing;

-- Create indexes for better performance
create index if not exists ix_fact_sales_tenant_date on analytics.fact_sales(tenant_id, sale_date);
create index if not exists ix_fact_sales_tenant_sku_date on analytics.fact_sales(tenant_id, sku, sale_date);
create index if not exists ix_fact_sales_tenant_channel_date on analytics.fact_sales(tenant_id, channel, sale_date);
create index if not exists ix_fact_sales_tenant_category_date on analytics.fact_sales(tenant_id, category, sale_date);
