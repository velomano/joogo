import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    const skus = searchParams.get('skus')?.split(',') || [];
    
    console.log('🔍 재고 통계 API 호출:', { tenantId, skus: skus.length });
    
    if (skus.length === 0) {
      return NextResponse.json({ ok: false, error: 'SKU 목록이 필요합니다' });
    }
    
    // 재고 데이터 조회
    const { data: inventoryData, error } = await sb
      .from('fact_sales')
      .select('sku, original_data')
      .eq('tenant_id', tenantId)
      .not('original_data', 'is', null)
      .in('sku', skus);
    
    if (error) {
      console.error('❌ 재고 데이터 조회 오류:', error);
      return NextResponse.json({ ok: false, error: error.message });
    }
    
    console.log('🔍 재고 데이터 조회 결과:', inventoryData?.length || 0, '개');
    
    // 재고 가치와 평균 재고 수준 계산
    let totalStockValue = 0;
    let totalStockLevel = 0;
    let validStockItems = 0;
    
    inventoryData?.forEach(item => {
      const originalData = item.original_data?.original_data || item.original_data;
      const stockOnHand = parseFloat(originalData?.stock_on_hand || '0');
      const unitCost = parseFloat(originalData?.unit_cost || '0');
      
      if (stockOnHand > 0 && unitCost > 0) {
        totalStockValue += stockOnHand * unitCost;
        totalStockLevel += stockOnHand;
        validStockItems++;
      }
    });
    
    const avgStockLevel = validStockItems > 0 ? totalStockLevel / validStockItems : 0;
    
    console.log('🔍 계산된 재고 통계:', {
      totalStockValue,
      avgStockLevel,
      validStockItems
    });
    
    return NextResponse.json({
      ok: true,
      data: {
        totalStockValue,
        avgStockLevel: Math.round(avgStockLevel),
        validStockItems
      }
    });
  } catch (e: any) {
    console.error('❌ 재고 통계 API 오류:', e?.message, e?.stack);
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
