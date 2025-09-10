export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    // 기존 테넌트 ID를 하드코딩으로 추가
    const hardcodedTenants = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Joogo Test Company',
        created_at: new Date().toISOString()
      }
    ];
    
    // 실제 데이터베이스에서 테넌트 목록 조회
    const { data: tenants, error } = await supaAdmin()
      .from('tenants')
      .select('id, name, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Tenants fetch error:', error);
      // 에러가 있어도 하드코딩된 테넌트는 반환
      return NextResponse.json({
        ok: true,
        tenants: hardcodedTenants,
        message: '하드코딩된 테넌트를 사용합니다.'
      });
    }
    
    // 데이터베이스 테넌트와 하드코딩된 테넌트를 합침
    const allTenants = [...hardcodedTenants, ...(tenants || [])];
    
    return NextResponse.json({
      ok: true,
      tenants: allTenants,
      count: allTenants.length
    });

  } catch (e: any) {
    console.error("[/api/tenants] ERROR:", e?.message, e?.stack);
    // 에러가 있어도 하드코딩된 테넌트는 반환
    return NextResponse.json({ 
      ok: true, 
      tenants: [
        {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'Joogo Test Company',
          created_at: new Date().toISOString()
        }
      ],
      message: '하드코딩된 테넌트를 사용합니다.'
    });
  }
}
