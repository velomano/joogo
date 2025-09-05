export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE!;

async function broadcastReset(tenantId: string) {
  // 선택: Supabase Realtime REST 또는 your channel. 간단히 no-op 가능.
  // 클라이언트는 /reset 응답을 받고 자체 초기화해도 충분.
  console.log(`[reset] Broadcasting reset for tenant: ${tenantId}`);
}

export async function POST(req: Request) {
  try {
    const { scope, tenantId, fileId, confirm } = await req.json().catch(()=>({}));
    
    if (confirm !== 'DELETE') {
      return NextResponse.json({ error: 'CONFIRM_DELETE_REQUIRED' }, { status: 400 });
    }
    if (!tenantId) return NextResponse.json({ error: 'TENANT_REQUIRED' }, { status: 400 });
    if (scope === 'file' && !fileId) {
      return NextResponse.json({ error: 'FILE_ID_REQUIRED' }, { status: 400 });
    }

    const supa = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const fn = scope === 'file' ? 'public.reset_file' : 'public.reset_tenant';
    const args: any = scope === 'file'
      ? { p_tenant_id: tenantId, p_file_id: fileId }
      : { p_tenant_id: tenantId };

    console.log(`[reset] Calling ${fn} with args:`, args);

    const { data, error } = await supa.rpc(fn, args);
    if (error) {
      console.error('[reset] RPC error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await broadcastReset(tenantId);

    console.log(`[reset] Success: ${JSON.stringify(data)}`);

    return new NextResponse(JSON.stringify({ 
      ok: true, 
      data, 
      ts: Date.now(),
      scope,
      tenantId,
      fileId 
    }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        // 모든 캐시 무력화
        'cache-control': 'no-store, no-cache, must-revalidate',
        'pragma': 'no-cache',
        'x-reset-buster': String(Date.now())
      }
    });

  } catch (e: any) {
    console.error('[reset] ERROR:', e?.message, e?.stack);
    return NextResponse.json({ 
      error: e?.message ?? 'reset error' 
    }, { status: 500 });
  }
}
