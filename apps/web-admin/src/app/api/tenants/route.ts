export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    
    // 실제 테넌트 목록 조회 (public 스키마 사용)
    const { data: tenants, error } = await sb
      .from('tenants')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tenants] Database error:', error);
      throw error;
    }

    // 테넌트가 없으면 빈 배열 반환
    if (!tenants || tenants.length === 0) {
      return NextResponse.json({
        ok: true,
        tenants: []
      });
    }

    // 데이터가 있는 테넌트만 필터링 (실제 업로드된 데이터가 있는 테넌트)
    const tenantsWithData = [];
    
    for (const tenant of tenants) {
      try {
        // 각 테넌트에 대해 데이터 존재 여부 확인
        const { data: salesData, error: salesError } = await sb
          .from('analytics.fact_sales')
          .select('tenant_id')
          .eq('tenant_id', tenant.id)
          .limit(1);
        
        if (salesError) {
          console.warn(`[tenants] Sales data check failed for tenant ${tenant.id}:`, salesError);
          // 에러가 있어도 테넌트는 포함 (데이터가 없을 수도 있음)
        }
        
        // 데이터가 있거나 에러가 없으면 테넌트 포함
        if (!salesError) {
          tenantsWithData.push({
            id: tenant.id,
            name: tenant.name,
            created_at: tenant.created_at
          });
        }
      } catch (tenantError) {
        console.warn(`[tenants] Error checking tenant ${tenant.id}:`, tenantError);
        // 개별 테넌트 에러는 무시하고 계속 진행
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
