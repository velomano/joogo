-- 0044_create_missing_rpc_functions.sql
set role postgres;

-- board_abc_by_sku 함수 생성
create or replace function public.board_abc_by_sku(
  p_from     date default null,
  p_to       date default null,
  p_region   text[] default null,
  p_channel  text[] default null,
  p_category text[] default null,
  p_sku      text[] default null
) returns table(
  sku text, category text, qty numeric, revenue numeric, abc_class text
)
language sql stable security definer
as $$
  select 
    s.barcode::text as sku,
    s.productname::text as category,
    sum(s.qty)::numeric as qty,
    sum(s.revenue)::numeric as revenue,
    case 
      when sum(s.revenue) >= 100000 then 'A'
      when sum(s.revenue) >= 50000 then 'B'
      else 'C'
    end as abc_class
  from public.sales s
  where (p_from is null or s.sale_date >= p_from)
    and (p_to is null or s.sale_date <= p_to)
    and (p_region is null or null::text = any(p_region))
    and (p_channel is null or s.channel = any(p_channel))
    and (p_category is null or s.productname = any(p_category))
    and (p_sku is null or s.barcode::text = any(p_sku))
  group by s.barcode, s.productname
  order by sum(s.revenue) desc
$$;

-- board_reorder_points 함수 생성
create or replace function public.board_reorder_points(
  p_tenant_id uuid default null,
  p_from      date default null,
  p_to        date default null,
  p_lead_time int default 7,
  p_z_score   numeric default 1.65
) returns table(
  sku text, category text, avg_daily_qty numeric, reorder_point numeric
)
language sql stable security definer
as $$
  select 
    s.barcode::text as sku,
    s.productname::text as category,
    avg(s.qty)::numeric as avg_daily_qty,
    (avg(s.qty) * p_lead_time * p_z_score)::numeric as reorder_point
  from public.sales s
  where (p_from is null or s.sale_date >= p_from)
    and (p_to is null or s.sale_date <= p_to)
  group by s.barcode, s.productname
  order by avg(s.qty) desc
$$;

-- board_eol_candidates 함수 생성
create or replace function public.board_eol_candidates(
  p_tenant_id uuid default null,
  p_from      date default null,
  p_limit     int default 100
) returns table(
  sku text, category text, last_sale_date date, days_since_last_sale int
)
language sql stable security definer
as $$
  select 
    s.barcode::text as sku,
    s.productname::text as category,
    max(s.sale_date)::date as last_sale_date,
    (current_date - max(s.sale_date))::int as days_since_last_sale
  from public.sales s
  where (p_from is null or s.sale_date >= p_from)
  group by s.barcode, s.productname
  having (current_date - max(s.sale_date)) > 30
  order by days_since_last_sale desc
  limit p_limit
$$;

-- 권한 부여
grant execute on function public.board_abc_by_sku(date,date,text[],text[],text[],text[]) to anon, authenticated;
grant execute on function public.board_reorder_points(uuid,date,date,int,numeric) to anon, authenticated;
grant execute on function public.board_eol_candidates(uuid,date,int) to anon, authenticated;

select pg_notify('pgrst','reload schema');
