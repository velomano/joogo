import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, key, { 
  auth: { persistSession: false }
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const tenant_id = formData.get('tenant_id') as string || '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다' }, { status: 400 });
    }

    // 파일 크기 제한 (25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기가 25MB를 초과합니다' }, { status: 400 });
    }

    // CSV 파일 검증
    if (!file.type.includes('csv') && !file.name.endsWith('.csv')) {
      return NextResponse.json({ error: 'CSV 파일만 업로드 가능합니다' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `incoming/${crypto.randomUUID()}_${file.name}`;

    // 1) Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ingest')
      .upload(storagePath, buffer, { 
        contentType: file.type || 'text/csv', 
        upsert: false 
      });

    if (uploadError) {
      console.error('[UPLOAD/UNIFIED] Storage upload error:', uploadError);
      throw uploadError;
    }

    // 2) RLS용 테넌트 설정
    try {
      await supabase.rpc('set_config', { 
        parameter: 'app.tenant_id', 
        value: tenant_id, 
        is_local: true 
      });
    } catch (rpcError) {
      // 함수가 없으면 무시
      console.log('[UPLOAD/UNIFIED] RPC set_config not available, continuing...');
    }

    // 3) raw_uploads 테이블에 메타데이터 저장
    const { data: insertData, error: insertError } = await supabase
      .from('raw_uploads')
      .insert({
        tenant_id: tenant_id,
        path: storagePath,
        status: 'RECEIVED'
      })
      .select()
      .single();

    if (insertError) {
      console.error('[UPLOAD/UNIFIED] Insert error:', insertError);
      // DB 저장 실패해도 파일은 업로드되었으므로 계속 진행
      const fileId = crypto.randomUUID();
      return NextResponse.json({ 
        success: true, 
        file_id: fileId,
        storage_path: storagePath,
        message: '파일이 업로드되었지만 DB 저장에 실패했습니다. 워커가 직접 처리할 수 있습니다.'
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true, 
      file_id: insertData.file_id,
      storage_path: storagePath,
      message: '파일이 성공적으로 업로드되었습니다. 처리 작업이 시작됩니다.'
    }, { status: 200 });

  } catch (error: any) {
    console.error('[UPLOAD/UNIFIED] Error:', error);
    return NextResponse.json({ 
      error: error.message || '업로드 실패' 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    success: true, 
    mode: 'unified-upload',
    message: 'POST 요청으로 파일과 tenant_id를 전송하세요'
  });
}