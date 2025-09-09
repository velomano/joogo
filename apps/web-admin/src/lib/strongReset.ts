import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ResetOptions {
  tenantId: string;
  hard?: boolean;
}

export async function handleReset(options: ResetOptions): Promise<void> {
  const { tenantId, hard = false } = options;
  
  try {
    console.log(`🔄 리셋 시작: tenant ${tenantId} ${hard ? '(하드 리셋)' : '(소프트 리셋)'}`);
    
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
  } catch (error) {
    console.error('❌ 리셋 실패:', error);
    throw error;
  }
}