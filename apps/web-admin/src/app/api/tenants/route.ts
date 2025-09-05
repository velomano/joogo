export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    
    // 실제 테넌트 목록 조회
    const { data: tenants, error } = await sb
      .from('core.tenants')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tenants] Database error:', error);
      throw error;
    }

    // 데이터가 있는 테넌트만 필터링 (실제 업로드된 데이터가 있는 테넌트)
    const tenantsWithData = [];
    
    for (const tenant of tenants || []) {
      // 각 테넌트에 대해 데이터 존재 여부 확인
      const { data: salesData } = await sb
        .from('analytics.fact_sales')
        .select('tenant_id')
        .eq('tenant_id', tenant.id)
        .limit(1);
      
      if (salesData && salesData.length > 0) {
        tenantsWithData.push({
          id: tenant.id,
          name: tenant.name,
          created_at: tenant.created_at
        });
      }
    }

    return NextResponse.json({
      ok: true,
      tenants: tenantsWithData
    });

  } catch (e: any) {
    console.error("[/api/tenants] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "tenants fetch error" 
    }, { status: 500 });
  }
}
