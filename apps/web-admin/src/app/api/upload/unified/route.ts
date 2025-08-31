export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



function getSupabaseAdmin() {
  const url = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/\/+$/,'');
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || '').trim();
  if (!url) throw new Error('Missing SUPABASE_URL');
  if (!key) throw new Error('Missing service role key');
  // RPC는 public에 있으므로 기본 스키마를 public으로 고정
  return createClient(url, key, { auth: { persistSession: false }, db: { schema: 'public' } });
}

const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tenant_id = formData.get('tenant_id') as string;
    
    if (!file || !tenant_id) {
      return NextResponse.json({ ok: false, error: 'file and tenant_id required' }, { status: 400 });
    }
    
    // 파일 정보 추출
    const fileName = file.name;
    const fileSize = file.size;
    const fileBuffer = await file.arrayBuffer();
    
    // 현재 날짜 기반 폴더 경로 생성
    const now = new Date();
    const dateFolder = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now();
    const storagePath = `${dateFolder}/${timestamp}-${fileName}`;

    const supabase = getSupabaseAdmin();

    // 파일을 Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ingest')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false
      });
    
    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    // ✅ UUID 아니면 토큰으로 간주해 해석
    let tenantUuid = String(tenant_id);
    if (!isUuid(tenantUuid)) {
      const { data: resolved, error: rerr } = await supabase.rpc('resolve_tenant_id', { p_token: tenantUuid });
      if (rerr) throw rerr;
      if (!resolved) return NextResponse.json({ ok:false, error:'unknown tenant token' }, { status:400 });
      tenantUuid = resolved as string;
    }

    // ✅ 실제 등록 (analytics에 insert)
    const { data, error } = await supabase.rpc('raw_uploads_insert', {
      p_path: storagePath,
      p_tenant_id: tenantUuid,
      p_bytes: fileSize,
      p_checksum: null,
      p_status: 'RECEIVED',
    });
    if (error) throw error;

    return NextResponse.json({ ok: true, file_id: data }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, mode: 'token-enabled' });
}
