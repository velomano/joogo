export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenant_id = formData.get('tenant_id') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Supabase 클라이언트 생성 - 올바른 환경변수 사용
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 파일을 Supabase Storage에 업로드
    const fileName = `${tenant_id}/${Date.now()}_${file.name}`;
    const buffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('csv-uploads')
      .upload(fileName, buffer, {
        contentType: file.type || 'text/csv',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    // ingest-worker에 작업 요청을 위한 작업 레코드 생성
    const { data: jobData, error: jobError } = await supabase
      .from('ingest_jobs')
      .insert({
        tenant_id,
        file_name: fileName,
        file_size: file.size,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation failed:', jobError);
      return NextResponse.json(
        { error: 'Failed to create ingest job' },
        { status: 500 }
      );
    }

    // ingest-worker에 작업 요청 (HTTP 호출 또는 메시지 큐)
    try {
      const workerUrl = process.env.INGEST_WORKER_URL || 'http://localhost:3001';
      const response = await fetch(`${workerUrl}/api/ingest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.INGEST_WORKER_SECRET || 'default-secret'}`
        },
        body: JSON.stringify({
          job_id: jobData.id,
          tenant_id,
          file_name: fileName,
          file_size: file.size
        })
      });

      if (!response.ok) {
        console.warn('Worker notification failed, but job is created');
      }
    } catch (workerError) {
      console.warn('Worker notification failed:', workerError);
      // 작업은 생성되었으므로 계속 진행
    }

    return NextResponse.json({
      success: true,
      job_id: jobData.id,
      file_name: fileName,
      status: 'uploaded',
      message: '파일이 업로드되었습니다. 파싱 작업이 시작됩니다.',
      meta: {
        total_rows: 'processing...',
        file_name: file.name,
        file_size: file.size,
        job_created_at: jobData.created_at
      }
    });

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}


