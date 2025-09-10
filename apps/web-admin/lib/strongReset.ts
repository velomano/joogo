import { createClient } from '@supabase/supabase-js';

export interface ResetOptions {
  tenantId: string;
  hard?: boolean;
}

export async function strongReset(params: { tenantId: string; hard?: boolean }) {
  const { tenantId, hard = false } = params;
  if (!tenantId) throw new Error('tenantId required');
  
  try {
    console.log(`🔄 리셋 시작: tenant ${tenantId} ${hard ? '(하드 리셋)' : '(소프트 리셋)'}`);

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // RPC 함수 호출
    const { error } = await supabase.rpc('board_reset_tenant_data', {
      p_tenant_id: tenantId,
      p_hard: hard
    });

    if (error) {
      console.error('❌ 리셋 실패:', error);
      throw new Error(`RESET_HTTP_500: ${error.message}`);
    }

    console.log('✅ 리셋 완료');
    return { ok: true };
  } catch (error) {
    console.error('❌ 리셋 실패:', error);
    throw error;
  }
}

// 클라이언트 사이드 리셋 함수
export async function strongClientReset(tenantId: string): Promise<void> {
  try {
    const response = await fetch('/api/board/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId, hard: true })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    console.log('✅ 클라이언트 리셋 완료');
  } catch (error) {
    console.error('❌ 클라이언트 리셋 실패:', error);
    throw error;
  }
}