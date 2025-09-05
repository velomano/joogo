-- Add board_reset_tenant_data RPC function for data reset functionality
-- This function safely deletes all data for a specific tenant across all relevant tables

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

  -- Delete from analytics.fact_sales
  DELETE FROM analytics.fact_sales WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_fact_deleted = ROW_COUNT;

  -- Delete from analytics.stage_sales
  DELETE FROM analytics.stage_sales WHERE tenant_id = p_tenant_id::text;
  GET DIAGNOSTICS v_stage_deleted = ROW_COUNT;

  -- Delete from public.items
  DELETE FROM public.items WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_items_deleted = ROW_COUNT;

  -- Delete from analytics.raw_uploads
  DELETE FROM analytics.raw_uploads WHERE tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_uploads_deleted = ROW_COUNT;

  -- Delete from analytics.ingest_jobs (both schemas)
  DELETE FROM analytics.ingest_jobs WHERE tenant_id = p_tenant_id::text;
  GET DIAGNOSTICS v_jobs_deleted = ROW_COUNT;

  -- Calculate total deleted rows
  v_total_deleted := v_fact_deleted + v_stage_deleted + v_items_deleted + v_uploads_deleted + v_jobs_deleted;

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
'Resets all data for a specific tenant across analytics and public schemas. Returns count of deleted rows from each table.';
