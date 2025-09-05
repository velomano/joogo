-- Enhanced reset function that handles all possible tenant_id formats
CREATE OR REPLACE FUNCTION public.board_reset_tenant_data(p_tenant_id UUID)
RETURNS TABLE(
  deleted_rows INTEGER,
  fact_deleted INTEGER,
  stage_deleted INTEGER,
  items_deleted INTEGER,
  uploads_deleted INTEGER,
  jobs_deleted INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fact_deleted INTEGER := 0;
  v_stage_deleted INTEGER := 0;
  v_items_deleted INTEGER := 0;
  v_uploads_deleted INTEGER := 0;
  v_jobs_deleted INTEGER := 0;
  v_total_deleted INTEGER := 0;
BEGIN
  -- Validate tenant_id
  IF p_tenant_id IS NULL THEN
    RAISE EXCEPTION 'tenant_id cannot be null';
  END IF;

  RAISE NOTICE 'Starting enhanced reset for tenant_id: %', p_tenant_id;

  -- Delete from analytics.fact_sales (UUID format)
  RAISE NOTICE 'Deleting from analytics.fact_sales (UUID format) for tenant_id: %', p_tenant_id;
  DELETE FROM analytics.fact_sales WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_fact_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from analytics.fact_sales (UUID)', v_fact_deleted;

  -- Delete from analytics.fact_sales (text format)
  DELETE FROM analytics.fact_sales WHERE tenant_id::text = p_tenant_id::text;
  GET DIAGNOSTICS v_fact_deleted = v_fact_deleted + ROW_COUNT;
  RAISE NOTICE 'Deleted % total rows from analytics.fact_sales', v_fact_deleted;

  -- Delete from analytics.stage_sales (text format)
  DELETE FROM analytics.stage_sales WHERE tenant_id = p_tenant_id::text;
  GET DIAGNOSTICS v_stage_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from analytics.stage_sales', v_stage_deleted;

  -- Delete from public.items (UUID format)
  DELETE FROM public.items WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_items_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from public.items', v_items_deleted;

  -- Delete from analytics.raw_uploads (UUID format)
  DELETE FROM analytics.raw_uploads WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_uploads_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from analytics.raw_uploads', v_uploads_deleted;

  -- Delete from analytics.ingest_jobs (text format)
  DELETE FROM analytics.ingest_jobs WHERE tenant_id = p_tenant_id::text;
  GET DIAGNOSTICS v_jobs_deleted = ROW_COUNT;
  RAISE NOTICE 'Deleted % rows from analytics.ingest_jobs', v_jobs_deleted;

  -- Calculate total deleted rows
  v_total_deleted := v_fact_deleted + v_stage_deleted + v_items_deleted + v_uploads_deleted + v_jobs_deleted;

  RAISE NOTICE 'Enhanced reset completed. Total deleted: %', v_total_deleted;

  -- Return results
  RETURN QUERY SELECT 
    v_total_deleted,
    v_fact_deleted,
    v_stage_deleted,
    v_items_deleted,
    v_uploads_deleted,
    v_jobs_deleted;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.board_reset_tenant_data(UUID) TO authenticated;

-- Add comment for documentation
COMMENT ON FUNCTION public.board_reset_tenant_data(UUID) IS 
'Enhanced reset function that handles all possible tenant_id formats (UUID and text) across analytics and public schemas.';
