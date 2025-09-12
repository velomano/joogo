import { NextRequest, NextResponse } from 'next/server';
import { runCafe24Ingest } from '../cron/cafe24-ingest';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Cron job API called');
    
    // 인증 확인 (간단한 시크릿 키)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.CRON_SECRET || 'dev-secret';
    
    if (!authHeader || !authHeader.includes(expectedSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 크론 작업 실행
    await runCafe24Ingest();
    
    return NextResponse.json({
      success: true,
      message: 'Cron job executed successfully',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Cron job API error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Cron job execution failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
