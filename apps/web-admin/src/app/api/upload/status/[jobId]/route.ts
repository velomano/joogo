
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// output: export와 호환되도록 generateStaticParams 추가
export async function generateStaticParams() {
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    const jobId = params.jobId;
    
    // Supabase 클라이언트 생성 - 올바른 환경변수 사용
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 작업 상태 조회
    const { data: job, error: jobError } = await supabase
      .from('ingest_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('tenant_id', tenant_id)
      .single();

    if (jobError) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // 작업 결과가 있으면 함께 반환
    let result = null;
    if (job.status === 'completed' && job.result) {
      try {
        result = typeof job.result === 'string' ? JSON.parse(job.result) : job.result;
      } catch (e) {
        result = { raw_result: job.result };
      }
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      file_name: job.file_name,
      file_size: job.file_size,
      created_at: job.created_at,
      updated_at: job.updated_at,
      error: job.error,
      result: result,
      progress: job.progress || 0,
      message: getStatusMessage(job.status, job.error)
    });

  } catch (error: any) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to check job status' },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string, error?: string): string {
  switch (status) {
    case 'pending':
      return '업로드 완료. 파싱 작업 대기 중...';
    case 'processing':
      return 'CSV 파일을 파싱하고 있습니다...';
    case 'completed':
      return '파싱 작업이 완료되었습니다.';
    case 'failed':
      return `파싱 작업 실패: ${error || '알 수 없는 오류'}`;
    default:
      return '알 수 없는 상태';
  }
}
