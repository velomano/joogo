export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const { tenant_id } = await req.json();
    
    if (!tenant_id) {
      return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });
    }

    const sb = supaAdmin();
    
    // RPC 함수를 사용하여 데이터 삭제
    const { data: result, error } = await sb.rpc("board_reset_tenant_data", {
      p_tenant_id: tenant_id
    });

    if (error) {
      console.error("[reset] RPC error:", error);
      throw error;
    }

    // 추가로 original_data JSONB 컬럼에서도 삭제
    const { error: jsonbError } = await sb
      .from('analytics.fact_sales')
      .delete()
      .eq('tenant_id', tenant_id);

    if (jsonbError) {
      console.error("[reset] JSONB cleanup error:", jsonbError);
    }

    // original_data JSONB에서 tenant_id가 포함된 행도 삭제
    const { error: jsonbTenantError } = await sb
      .from('analytics.fact_sales')
      .delete()
      .contains('original_data', { tenant_id: tenant_id });

    if (jsonbTenantError) {
      console.error("[reset] JSONB tenant cleanup error:", jsonbTenantError);
    }

    console.log(`[reset] Success: tenant=${tenant_id}, deleted=${result?.deleted_rows || 0} rows`);

    return NextResponse.json({
      ok: true,
      tenant_id,
      deleted_rows: result?.deleted_rows || 0,
      fact_deleted: result?.fact_deleted || 0,
      stage_deleted: result?.stage_deleted || 0
    });

  } catch (e: any) {
    console.error("[/api/board/reset] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "reset error" 
    }, { status: 500 });
  }
}
