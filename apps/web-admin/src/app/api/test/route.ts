
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 환경변수 확인
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + '...',
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
    };

    return NextResponse.json({
      success: true,
      message: 'Environment check completed',
      envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
