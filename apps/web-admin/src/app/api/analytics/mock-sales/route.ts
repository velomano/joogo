import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = String(body.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '');
    const days = Number(body.days || 7);
    
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
    
    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });

    // Mock 데이터 생성
    const { data, error } = await supabase.rpc('generate_mock_sales', { 
      _tenant_id: tenantId, 
      _days: days 
    });
    
    if (error) throw error;
    
    return NextResponse.json({ 
      generated: data || 0,
      message: `${days}일간 ${data || 0}개의 Mock 판매 데이터가 생성되었습니다.`
    });
    
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

// 데이터 리셋 기능 추가
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');
    
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
    
    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });

    // RPC 함수를 사용하여 데이터 삭제
    const { error } = await supabase.rpc('reset_sales_by_tenant', { 
      _tenant_id: tenantId 
    });
    
    if (error) {
      // RPC 함수가 없으면 다른 방법 시도
      console.log('RPC reset_sales_by_tenant failed, trying alternative method:', error);
      
      // SQL 쿼리 직접 실행
      const { error: sqlError } = await supabase
        .rpc('exec_sql', { 
          sql: `DELETE FROM core.sales WHERE tenant_id = '${tenantId}'` 
        });
      
      if (sqlError) {
        console.log('exec_sql also failed:', sqlError);
        // 마지막 방법: 빈 응답으로 성공 처리 (실제로는 삭제 안됨)
        return NextResponse.json({ 
          message: `${tenantId}의 Mock 데이터 리셋을 시도했습니다. (실제 삭제는 수동으로 필요)`,
          reset: false,
          note: '데이터베이스에서 직접 삭제가 필요합니다.'
        });
      }
    }
    
    return NextResponse.json({ 
      message: `${tenantId}의 모든 Mock 판매 데이터가 삭제되었습니다.`,
      reset: true
    });
    
  } catch (e: any) {
    console.error('DELETE error:', e);
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


