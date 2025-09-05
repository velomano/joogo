-- Check what tenant_ids exist in the database

CREATE OR REPLACE FUNCTION public.check_tenant_data()
RETURNS TABLE(
  table_name TEXT,
  tenant_id TEXT,
  row_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check analytics.fact_sales
  RETURN QUERY
  SELECT 
    'analytics.fact_sales'::TEXT as table_name,
    COALESCE(tenant_id::TEXT, 'NULL') as tenant_id,
    COUNT(*) as row_count
  FROM analytics.fact_sales 
  GROUP BY tenant_id
  ORDER BY row_count DESC;

  -- Check analytics.stage_sales
  RETURN QUERY
  SELECT 
    'analytics.stage_sales'::TEXT as table_name,
    COALESCE(tenant_id::TEXT, 'NULL') as tenant_id,
    COUNT(*) as row_count
  FROM analytics.stage_sales 
  GROUP BY tenant_id
  ORDER BY row_count DESC;

  -- Check public.items
  RETURN QUERY
  SELECT 
    'public.items'::TEXT as table_name,
    COALESCE(tenant_id::TEXT, 'NULL') as tenant_id,
    COUNT(*) as row_count
  FROM public.items 
  GROUP BY tenant_id
  ORDER BY row_count DESC;

  -- Check analytics.raw_uploads
  RETURN QUERY
  SELECT 
    'analytics.raw_uploads'::TEXT as table_name,
    COALESCE(tenant_id::TEXT, 'NULL') as tenant_id,
    COUNT(*) as row_count
  FROM analytics.raw_uploads 
  GROUP BY tenant_id
  ORDER BY row_count DESC;

  -- Check public.ingest_jobs
  RETURN QUERY
  SELECT 
    'public.ingest_jobs'::TEXT as table_name,
    COALESCE(tenant_id::TEXT, 'NULL') as tenant_id,
    COUNT(*) as row_count
  FROM public.ingest_jobs 
  GROUP BY tenant_id
  ORDER BY row_count DESC;

END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_tenant_data() TO authenticated;

