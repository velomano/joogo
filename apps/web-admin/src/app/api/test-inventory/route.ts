import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    
    // RPC 함수 직접 호출
    const { data, error } = await sb.rpc('board_reorder_points', {
      p_tenant_id: '84949b3c-2cb7-4c42-b9f9-d1f37d371e00',
      p_from: '2025-01-01',
      p_to: '2025-12-31',
      p_lead_time_days: 7,
      p_z: 1.65
    });
    
    if (error) {
      console.error('❌ 테스트 쿼리 오류:', error);
      return NextResponse.json({ ok: false, error: error.message });
    }
    
    console.log('🔍 직접 쿼리 결과:', data);
    
    return NextResponse.json({ 
      ok: true, 
      data,
      message: '재고 데이터 테스트 완료'
    });
    
  } catch (e: any) {
    console.error('❌ 테스트 오류:', e);
    return NextResponse.json({ 
      ok: false, 
      error: e.message || "테스트 실패" 
    }, { status: 500 });
  }
}
