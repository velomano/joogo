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
    // 데이터 존재 여부 확인
    const { data: factCheck } = await sb
      .from('analytics.fact_sales')
      .select('id')
      .eq('tenant_id', tenant)
      .limit(1);

    // 데이터가 없으면 빈 응답 반환
    if (!factCheck || factCheck.length === 0) {
      console.log('🔍 데이터 없음 - 빈 응답 반환');
      return NextResponse.json({
        ok: true,
        tempReg: null,
        spendReg: null,
        abc: [],
        reorder: [],
        eol: [],
        movers: [],
        inventoryStats: {
          totalStockValue: 0,
          totalStockLevel: 0,
          avgStockLevel: 0,
          validStockItems: 0,
          urgent: 0,
          review: 0,
          stable: 0,
          eol: 0
        }
      });
    }

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

    // 재고 통계 계산 (RPC 함수에서 이미 계산된 값 사용)
    const reorderData = asArr(rop);
    let inventoryStats = {
      totalStockValue: 0,
      totalStockLevel: 0,
      avgStockLevel: 0,
      validStockItems: 0,
      urgent: 0,
      review: 0,
      stable: 0,
      eol: 0
    };

    if (reorderData.length > 0) {
      // RPC 함수에서 이미 계산된 값들 사용
      let totalStockValue = 0;
      let totalStockLevel = 0;
      let validStockItems = 0;
      let urgent = 0;
      let review = 0;
      let stable = 0;

      reorderData.forEach(item => {
        const stockOnHand = Number(item.stock_on_hand || 0);
        const unitCost = Number(item.unit_cost || 0);
        const reorderGapDays = Number(item.reorder_gap_days || 0);
        
        // 재고 수량은 항상 누적 (0이어도)
        totalStockLevel += stockOnHand;
        
        if (stockOnHand > 0 && unitCost > 0) {
          totalStockValue += stockOnHand * unitCost;
          validStockItems++;
        }

        // 재고 상태 분류
        if (reorderGapDays <= 3) {
          urgent++;
        } else if (reorderGapDays <= 7) {
          review++;
        } else {
          stable++;
        }
      });

      inventoryStats = {
        totalStockValue: Math.round(totalStockValue),
        totalStockLevel: Math.round(totalStockLevel),
        avgStockLevel: validStockItems > 0 ? Math.round(totalStockLevel / validStockItems) : 0,
        validStockItems,
        urgent,
        review,
        stable,
        eol: asArr(eol).length
      };
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


    return NextResponse.json(payload, {
      headers: { 
        'cache-control': 'no-store, no-cache, must-revalidate',
        'pragma': 'no-cache'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "insights error" }, { status: 500 });
  }
}
