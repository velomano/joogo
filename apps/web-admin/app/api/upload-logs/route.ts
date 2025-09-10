export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id');
    
    if (!tenantId) {
      return NextResponse.json({ ok: false, error: 'tenant_id required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('upload_logs')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('[upload_logs] 조회 실패:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, logs: data || [] });
  } catch (e: any) {
    console.error('[upload_logs] 에러:', e);
    return NextResponse.json({ ok: false, error: e?.message ?? 'FETCH_FAILED' }, { status: 500 });
  }
}
