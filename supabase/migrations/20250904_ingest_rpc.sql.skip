-- === Ingest RPC Functions (pg 없이 supabase-js만 사용) ===

create or replace function public.board_stage_insert_rows(
  p_tenant_id uuid,
  p_file_id uuid,
  p_rows jsonb
) returns void
language plpgsql
security definer
set search_path = public, analytics
as $$
begin
  insert into analytics.stage_sales(
    tenant_id, file_id, row_num, sale_date, region, channel, category, sku,
    qty, revenue, ad_cost, discount_rate, tavg, original_data
  )
  select
    p_tenant_id,
    p_file_id,
    (x->>'row_num')::int,
    (x->>'sale_date')::date,
    nullif(x->>'region',''),
    nullif(x->>'channel',''),
    nullif(x->>'category',''),
    nullif(x->>'sku',''),
    nullif((x->>'qty')::numeric,0),
    nullif((x->>'revenue')::numeric,0),
    nullif((x->>'ad_cost')::numeric,0),
    nullif((x->>'discount_rate')::numeric,0),
    nullif((x->>'tavg')::numeric,0),
    x
  from jsonb_array_elements(p_rows) as x;
end;
$$;

create or replace function public.board_merge_file(
  p_tenant_id uuid,
  p_file_id uuid
) returns void
language sql
security definer
set search_path = public, analytics
as $$
  select analytics.merge_stage_to_fact(p_tenant_id, p_file_id);
$$;

-- 권한 부여
grant execute on function public.board_stage_insert_rows(uuid,uuid,jsonb) to anon, authenticated, service_role;
grant execute on function public.board_merge_file(uuid,uuid) to anon, authenticated, service_role;
