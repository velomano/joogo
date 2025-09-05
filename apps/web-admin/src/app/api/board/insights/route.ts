export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tenant = url.searchParams.get("tenant_id") || "";
    const from = url.searchParams.get("from") || "2025-01-01";
    const to   = url.searchParams.get("to")   || "2025-12-31";
    const region   = url.searchParams.get("region");
    const channel  = url.searchParams.get("channel");
    const category = url.searchParams.get("category");
    const sku      = url.searchParams.get("sku");
    const z    = Number(url.searchParams.get("z") ?? "1.65");
    const lt   = Number(url.searchParams.get("lead_time") ?? "7");
    
    if (!tenant) return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });

    const sb = supaAdmin();
    const [
      tempReg, spendReg, abc, rop, eol, movers
    ] = await Promise.all([
      sb.rpc("board_reg_qty_tavg", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_reg_rev_spend", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_abc_by_sku", { p_tenant_id: tenant, p_from: from, p_to: to }),
      sb.rpc("board_reorder_points", { p_tenant_id: tenant, p_from: from, p_to: to, p_lead_time_days: lt, p_z: z }),
      sb.rpc("board_eol_candidates", { p_tenant_id: tenant }),
      sb.rpc("board_top_movers", { p_tenant_id: tenant, p_to: to })
    ]);

    const get0 = (r: any) => Array.isArray(r?.data) ? (r.data[0] ?? null) : null;
    const asArr= (r: any) => Array.isArray(r?.data) ? r.data : [];

    // 재고 통계 계산
    const reorderData = asArr(rop);
    let inventoryStats = {
      totalStockValue: 0,
      avgStockLevel: 0,
      validStockItems: 0
    };

    if (reorderData.length > 0) {
      try {
        const skus = reorderData.map(item => item.sku);
        console.log('🔍 조회할 SKU 목록:', skus);
        
        const { data: inventoryData, error } = await sb
          .schema('analytics')
          .from('fact_sales')
          .select('sku, original_data')
          .eq('tenant_id', tenant)
          .not('original_data', 'is', null)
          .in('sku', skus);
        
        console.log('🔍 재고 데이터 조회 결과:', { 
          count: inventoryData?.length || 0, 
          error: error?.message 
        });
        
        if (!error && inventoryData) {
          let totalStockValue = 0;
          let totalStockLevel = 0;
          let validStockItems = 0;
          
          inventoryData.forEach((item, index) => {
            console.log(`🔍 재고 데이터 ${index + 1}:`, {
              sku: item.sku,
              original_data: item.original_data
            });
            
            const originalData = item.original_data?.original_data || item.original_data;
            const stockOnHand = parseFloat(originalData?.stock_on_hand || '0');
            const unitCost = parseFloat(originalData?.unit_cost || '0');
            
            console.log(`🔍 ${item.sku} 재고 정보:`, {
              stockOnHand,
              unitCost,
              originalData: originalData
            });
            
            if (stockOnHand > 0 && unitCost > 0) {
              totalStockValue += stockOnHand * unitCost;
              totalStockLevel += stockOnHand;
              validStockItems++;
            }
          });
          
          console.log('🔍 최종 재고 통계:', {
            totalStockValue,
            avgStockLevel: validStockItems > 0 ? totalStockLevel / validStockItems : 0,
            validStockItems
          });
          
          inventoryStats = {
            totalStockValue,
            avgStockLevel: validStockItems > 0 ? totalStockLevel / validStockItems : 0,
            validStockItems
          };
        }
      } catch (error) {
        console.error('❌ 재고 통계 계산 오류:', error);
      }
    }

    const temp = get0(tempReg);
    const spend= get0(spendReg);
    
    const payload = {
      ok: true,
      tempReg: temp,          // slope, r2, elasticity …
      spendReg: spend,        // marginal_roas …
      abc: asArr(abc),        // sku, revenue, grade …
      reorder: asArr(rop),    // sku, reorder_point …
      eol: asArr(eol),        // sku, days_since …
      movers: asArr(movers),  // sku, zscore, direction
      inventoryStats,         // totalStockValue, avgStockLevel, validStockItems
    };

    console.log('🔍 board_reorder_points RPC 결과:', asArr(rop));
    console.log('🔍 RPC 응답 원본:', rop);

    return NextResponse.json(payload);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "insights error" }, { status: 500 });
  }
}
