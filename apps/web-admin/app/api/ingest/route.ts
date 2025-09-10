export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const sb = createClient(url, key, { auth: { persistSession: false } });

export async function POST(req: Request) {
  try {
    const raw = await req.json();
    console.log('[ingest] Raw input:', { 
      tenantId: raw.tenantId, 
      rowsCount: raw.rows?.length, 
      fileName: raw.fileName 
    });

    // 간단한 검증
    if (!raw.tenantId || !raw.rows || !Array.isArray(raw.rows) || raw.rows.length === 0) {
      return NextResponse.json({ ok: false, error: 'Invalid input: tenantId and rows required' }, { status: 400 });
    }

    const { tenantId, rows, fileName } = raw;
    console.log('[ingest] Received payload:', { 
      tenantId, 
      rowsCount: rows.length, 
      fileName 
    });
    
    // 첫 번째 행 샘플 출력
    if (rows && rows.length > 0) {
      console.log('[ingest] First row sample:', rows[0]);
    }

    // 업로드 로그 생성
    const { data: logData, error: logError } = await sb
      .from('upload_logs')
      .insert({
        tenant_id: tenantId,
        file_name: fileName || 'unknown.csv',
        file_size: 0,
        total_rows: rows.length,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('[upload_log] 생성 실패:', logError);
    }

    // 청크 업로드
    const CHUNK = 2000;
    let inserted = 0;

    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK);
      const { error } = await sb.rpc('board_sales_upload_json', {
        p_tenant_id: tenantId,
        p_rows: chunk
      });
      if (error) {
        // 로그 상태 업데이트
        if (logData?.id) {
          await sb
            .from('upload_logs')
            .update({ status: 'failed', error_message: error.message })
            .eq('id', logData.id);
        }
        throw error;
      }
      inserted += chunk.length;
    }

    // 로그 상태 업데이트
    if (logData?.id) {
      await sb
        .from('upload_logs')
        .update({ 
          status: 'completed', 
          inserted_rows: inserted, 
          skipped_rows: 0 
        })
        .eq('id', logData.id);
    }

    return NextResponse.json({ ok: true, inserted });
  } catch (e: any) {
    console.error('[ingest] error', e);
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
