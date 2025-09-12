import { NextRequest, NextResponse } from 'next/server';
import { runCafe24Ingest } from '../../../../ingest-worker/src/cron/cafe24-ingest';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Local cron job triggered from web dashboard');
    
    // 크론 작업 직접 실행 (서버리스 환경에서)
    await runCafe24Ingest();
    
    console.log('✅ Local cron job completed');
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Local cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Cron job execution failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
