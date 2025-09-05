export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // 임시로 빈 배열 반환 (데이터가 없을 때)
    // 실제 데이터가 업로드되면 테넌트 목록이 표시됨
    return NextResponse.json({
      ok: true,
      tenants: []
    });

  } catch (e: any) {
    console.error("[/api/tenants] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "tenants fetch error" 
    }, { status: 500 });
  }
}
