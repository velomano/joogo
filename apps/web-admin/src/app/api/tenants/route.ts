export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // 실제 데이터베이스에서 테넌트 목록 조회
    const { data: tenants, error } = await supaAdmin
      .from('tenants')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Tenants fetch error:', error);
      return NextResponse.json({ 
        ok: false, 
        error: 'Failed to fetch tenants' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      ok: true,
      tenants: tenants || []
    });

  } catch (e: any) {
    console.error("[/api/tenants] ERROR:", e?.message, e?.stack);
    return NextResponse.json({ 
      ok: false, 
      error: e?.message ?? "tenants fetch error" 
    }, { status: 500 });
  }
}
