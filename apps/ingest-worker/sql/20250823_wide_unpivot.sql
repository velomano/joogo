-- 1) 검증 함수 (문장 1개)
CREATE OR REPLACE FUNCTION analytics.validate_stage_sales(p_file_id text)
RETURNS TABLE(rule text, severity text, bad_rows int, sample_rows int[])
LANGUAGE sql STABLE
AS $val$
  WITH s AS (
    SELECT row_num, NULLIF(sku::text,'') AS sku_txt, tenant_id
    FROM analytics.stage_sales
    WHERE file_id::text = p_file_id
  )
  SELECT
    'sku.required' AS rule, 'ERROR' AS severity,
    COUNT(*) AS bad_rows,
    ARRAY(SELECT row_num FROM s WHERE COALESCE(sku_txt,'')='' ORDER BY row_num LIMIT 5) AS sample_rows
  FROM s
  WHERE COALESCE(sku_txt,'')=''

  UNION ALL

  SELECT
    'tenant_id.required' AS rule, 'ERROR' AS severity,
    COUNT(*) AS bad_rows,
    ARRAY(
      SELECT row_num FROM s
      WHERE tenant_id IS NULL OR tenant_id::text !~* '^[0-9a-f-]{36}$'
      ORDER BY row_num LIMIT 5
    ) AS sample_rows
  FROM s
  WHERE tenant_id IS NULL OR tenant_id::text !~* '^[0-9a-f-]{36}$';
$val$;

-- 2) 머지 v3 (문장 1개)
CREATE OR REPLACE FUNCTION analytics.merge_stage_to_fact_v3(p_file_id text)
RETURNS jsonb
LANGUAGE plpgsql
AS $v3$
DECLARE v_merged int := 0;
BEGIN
  WITH
  base AS (
    SELECT s.*
    FROM analytics.stage_sales s
    WHERE s.file_id::text = p_file_id
      AND NULLIF(s.sku::text,'') IS NOT NULL
      AND s.tenant_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  ),
  known_cols AS (
    SELECT UNNEST(ARRAY[
      'tenant_id','sales_date','sku','channel','qty','revenue','cost',
      'warehouse_code','order_id','customer_id','region','brand',
      'extras','file_id','row_num','inserted_at','created_at','updated_at'
    ]) AS col
  ),
  kv_extras AS (
    SELECT
      b.tenant_id, b.sku, b.channel, b.warehouse_code, b.order_id, b.customer_id, b.region, b.brand,
      b.extras, b.file_id::text AS file_id_text, b.row_num,
      e.key  AS k, e.value AS vtxt
    FROM base b
    CROSS JOIN LATERAL jsonb_each_text(COALESCE(b.extras,'{}'::jsonb)) AS e(key,value)
  ),
  parsed_extras AS (
    SELECT
      tenant_id, sku, channel, warehouse_code, order_id, customer_id, region, brand,
      extras, file_id_text, row_num,
      NULLIF(regexp_replace(k,   '[^0-9]',   '', 'g'),'') AS ymd,
      NULLIF(regexp_replace(vtxt,'[^0-9.\-]','', 'g'),'') AS qty_txt
    FROM kv_extras
  ),
  raw_date_cols AS (
    SELECT c.column_name,
           regexp_match(c.column_name, '(\d{4})\D*(\d{1,2})\D*(\d{1,2})') AS m4
    FROM information_schema.columns c
    WHERE c.table_schema='analytics'
      AND c.table_name='stage_sales'
      AND c.column_name NOT IN (SELECT col FROM known_cols)
  ),
  date_cols AS (
    SELECT column_name,
           (m4)[1]::int AS yy, (m4)[2]::int AS mm, (m4)[3]::int AS dd
    FROM raw_date_cols
    WHERE m4 IS NOT NULL AND (m4)[2]::int BETWEEN 1 AND 12 AND (m4)[3]::int BETWEEN 1 AND 31
  ),
  exploded_cols AS (
    SELECT
      b.tenant_id, b.sku, b.channel, b.warehouse_code, b.order_id, b.customer_id, b.region, b.brand,
      b.extras, b.file_id::text AS file_id_text, b.row_num,
      lpad(dc.yy::text,4,'0')||lpad(dc.mm::text,2,'0')||lpad(dc.dd::text,2,'0') AS ymd,
      to_jsonb(b)->>dc.column_name AS vtxt
    FROM base b
    JOIN date_cols dc ON TRUE
  ),
  combined AS (
    SELECT * FROM parsed_extras
    UNION ALL
    SELECT * FROM exploded_cols
  ),
  dated AS (
    SELECT *, CASE WHEN length(ymd)=8 THEN to_date(ymd,'YYYYMMDD') END AS sales_date
    FROM combined
    WHERE ymd IS NOT NULL
  ),
  verified AS (
    SELECT *, to_char(sales_date,'YYYYMMDD') AS ymd_check
    FROM dated
    WHERE sales_date IS NOT NULL AND to_char(sales_date,'YYYYMMDD') = ymd
  ),
  qty_ok AS (
    SELECT *, CASE WHEN qty_txt ~ '^-?[0-9]+(\.[0-9]+)?$' THEN qty_txt::numeric END AS qty
    FROM verified
  ),
  final AS (
    SELECT
      tenant_id::uuid AS tenant_id,
      sales_date, sku,
      COALESCE(NULLIF(channel::text,''),'unknown') AS channel,
      qty,
      0::numeric AS revenue, 0::numeric AS cost,
      warehouse_code, order_id, customer_id, region, brand,
      extras, file_id_text, row_num
    FROM qty_ok
    WHERE qty IS NOT NULL AND qty <> 0
  ),
  ins AS (
    INSERT INTO analytics.fact_sales (
      tenant_id, sales_date, sku, channel, qty, revenue, cost, warehouse_code,
      order_id, customer_id, region, brand, extras, file_id, row_num
    )
    SELECT
      tenant_id, sales_date, sku, channel, qty, revenue, cost, warehouse_code,
      order_id, customer_id, region, brand, extras, file_id_text, row_num
    FROM final
    ON CONFLICT (tenant_id, source_key)
    DO UPDATE SET
      qty            = EXCLUDED.qty,
      revenue        = EXCLUDED.revenue,
      cost           = EXCLUDED.cost,
      channel        = EXCLUDED.channel,
      warehouse_code = EXCLUDED.warehouse_code,
      customer_id    = EXCLUDED.customer_id,
      region         = EXCLUDED.region,
      brand          = EXCLUDED.brand,
      extras         = COALESCE(analytics.fact_sales.extras,'{}'::jsonb)
                       || COALESCE(EXCLUDED.extras,'{}'::jsonb),
      file_id        = EXCLUDED.file_id,
      row_num        = EXCLUDED.row_num
    RETURNING 1
  )
  SELECT COUNT(*) INTO v_merged FROM ins;

  RETURN jsonb_build_object(
    'status', CASE WHEN v_merged>0 THEN 'merged' ELSE 'rejected' END,
    'merged_rows', v_merged,
    'hint', 'If merged_rows=0, ensure unknown headers are preserved into stage_sales (extras or actual date columns).'
  );
END;
$v3$;

-- 3) 게이트 함수 (문장 1개)
CREATE OR REPLACE FUNCTION analytics.try_merge_stage_to_fact(p_file_id text)
RETURNS jsonb
LANGUAGE plpgsql
AS $gate$
DECLARE v_errs int; v_report jsonb; v_result jsonb;
BEGIN
  SELECT COALESCE(SUM(bad_rows),0)
  INTO v_errs
  FROM analytics.validate_stage_sales(p_file_id);

  IF v_errs > 0 THEN
    SELECT jsonb_agg(jsonb_build_object('rule',rule,'bad_rows',bad_rows,'sample_rows',sample_rows))
    INTO v_report
    FROM analytics.validate_stage_sales(p_file_id);

    RETURN jsonb_build_object('status','rejected','errors',COALESCE(v_report,'[]'::jsonb));
  END IF;

  SELECT analytics.merge_stage_to_fact_v3(p_file_id) INTO v_result;
  RETURN v_result;
END;
$gate$;
