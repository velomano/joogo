import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const sb = supaAdmin();
    
    // 함수 업데이트 SQL
    const updateSQL = `
      drop function if exists public.board_reorder_points(uuid,date,date,int,numeric);

      create or replace function public.board_reorder_points(p_tenant_id uuid, p_from date, p_to date, p_lead_time_days int default 7, p_z numeric default 1.65)
      returns table(sku text, avg_daily numeric, std_daily numeric, reorder_point numeric, stock_on_hand numeric, unit_cost numeric, days_of_supply numeric, reorder_gap_days numeric)
      language sql security definer set search_path=public, analytics as $$
        with d as (
          select sku, sale_date, sum(coalesce(qty,0)) qty
          from analytics.fact_sales where tenant_id=p_tenant_id and sale_date between p_from and p_to and sku is not null
          group by sku, sale_date
        ), 
        stat as (
          select sku, avg(qty) avg_daily, stddev_samp(qty) std_daily 
          from d group by sku
        ),
        inventory as (
          select 
            sku,
            avg(coalesce((original_data->'original_data'->>'stock_on_hand')::numeric, 0)) as stock_on_hand,
            avg(coalesce((original_data->'original_data'->>'unit_cost')::numeric, 0)) as unit_cost
          from analytics.fact_sales 
          where tenant_id=p_tenant_id 
            and sale_date between p_from and p_to 
            and sku is not null
            and original_data is not null
          group by sku
        )
        select 
          s.sku, 
          s.avg_daily, 
          s.std_daily, 
          (s.avg_daily*p_lead_time_days) + (coalesce(s.std_daily,0)*sqrt(p_lead_time_days)*p_z) as reorder_point,
          coalesce(i.stock_on_hand, 0) as stock_on_hand,
          coalesce(i.unit_cost, 0) as unit_cost,
          case 
            when s.avg_daily > 0 then coalesce(i.stock_on_hand, 0) / s.avg_daily 
            else 0 
          end as days_of_supply,
          case 
            when s.avg_daily > 0 then (coalesce(i.stock_on_hand, 0) - ((s.avg_daily*p_lead_time_days) + (coalesce(s.std_daily,0)*sqrt(p_lead_time_days)*p_z))) / s.avg_daily
            else 0 
          end as reorder_gap_days
        from stat s
        left join inventory i on s.sku = i.sku
      $$;
    `;
    
    console.log('🔄 함수 업데이트 시작...');
    
    // 직접 SQL 실행 (exec_sql 대신)
    const { data, error } = await sb.from('_sql').select('*').eq('sql', updateSQL);
    
    if (error) {
      console.error('❌ 함수 업데이트 오류:', error);
      return NextResponse.json({ ok: false, error: error.message });
    }
    
    console.log('✅ 함수 업데이트 완료');
    
    return NextResponse.json({ ok: true, message: '함수 업데이트 완료' });
  } catch (e: any) {
    console.error('❌ 함수 업데이트 오류:', e?.message, e?.stack);
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
