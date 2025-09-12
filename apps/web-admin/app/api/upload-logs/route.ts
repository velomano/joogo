export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 환경변수는 런타임에 검증
let supabaseAdmin: any = null;

export async function GET(req: Request) {
  try {
    // 런타임에 환경변수 검증 및 Supabase 클라이언트 생성
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Missing Supabase environment variables' 
      }, { status: 500 });
    }

    if (!supabaseAdmin) {
      supabaseAdmin = createClient(url, key, { auth: { persistSession: false } });
    }

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
