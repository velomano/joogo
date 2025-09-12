import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Manual cron job triggered');
    
    // 크론 작업 실행 (ingest-worker의 크론 작업 호출)
    const cronResponse = await fetch(`${process.env.INGEST_WORKER_URL || 'http://localhost:3001'}/api/cron/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'dev-secret'}`
      }
    });
    
    if (!cronResponse.ok) {
      throw new Error(`Cron job failed: ${cronResponse.statusText}`);
    }
    
    const result = await cronResponse.json();
    
    console.log('✅ Manual cron job completed:', result);
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Manual cron job failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Cron job execution failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
