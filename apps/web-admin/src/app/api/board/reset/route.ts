export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    let tenant_id;
    try {
      const body = await req.json();
      tenant_id = body?.tenant_id;
    } catch (jsonError) {
      // JSON 파싱 실패 시 기본값 사용
      tenant_id = '00000000-0000-0000-0000-000000000001';
    }
    
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

