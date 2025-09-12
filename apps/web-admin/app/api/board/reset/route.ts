export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../../lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    let tenantId, hard;
    try {
      const body = await req.json();
      tenantId = body?.tenantId || body?.tenant_id;
      hard = body?.hard || false;
    } catch (jsonError) {
      // JSON 파싱 실패 시 기본값 사용
      tenantId = '00000000-0000-0000-0000-000000000001';
      hard = false;
    }
    
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: "tenantId missing" }, { status: 400 });
    }

    console.log(`[reset] 시작: tenantId=${tenantId}, hard=${hard}`);

    const sb = supaAdmin();
    
    // RPC 함수를 사용하여 데이터 삭제
    const { data: result, error } = await sb.rpc("board_reset_tenant_data", {
      p_tenant_id: tenantId,
      p_hard: hard
    });

    if (error) {
      console.error("[reset] RPC error:", error);
      throw error;
    }

    console.log(`[reset] 성공: tenantId=${tenantId}, result=`, result);

    return NextResponse.json({
      ok: true,
      tenantId,
      hard,
      ...result
    });

  } catch (e: any) {
    console.error("[/api/board/reset] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "reset error" 
    }, { status: 500 });
  }
}
