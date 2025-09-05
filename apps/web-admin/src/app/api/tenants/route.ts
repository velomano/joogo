export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    
    // 실제 데이터가 있는 테넌트 ID를 analytics.fact_sales에서 직접 조회
    const { data: tenantData, error } = await sb
      .from('analytics.fact_sales')
      .select('tenant_id')
      .order('tenant_id', { ascending: true });

    if (error) {
      console.error('[tenants] Database error:', error);
      throw error;
    }

    // 테넌트가 없으면 빈 배열 반환
    if (!tenantData || tenantData.length === 0) {
      return NextResponse.json({
        ok: true,
        tenants: []
      });
    }

    // 고유한 테넌트 ID 추출
    const uniqueTenantIds = [...new Set(tenantData.map(item => item.tenant_id))];
    
    // 테넌트 정보 생성 (실제 테넌트 테이블이 없으므로 ID 기반으로 생성)
    const tenants = uniqueTenantIds.map((tenantId, index) => ({
      id: tenantId,
      name: `테넌트 ${index + 1} (${tenantId.substring(0, 8)}...)`,
      created_at: new Date().toISOString()
    }));

    return NextResponse.json({
      ok: true,
      tenants: tenants
    });

  } catch (e: any) {
    console.error("[/api/tenants] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "tenants fetch error" 
    }, { status: 500 });
  }
}
