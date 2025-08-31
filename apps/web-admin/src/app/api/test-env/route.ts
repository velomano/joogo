
import { NextResponse } from 'next/server';


export async function GET() {
  try {
    // 환경변수 확인
    const envCheck = {
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ 설정됨' : '❌ 누락',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ 설정됨' : '❌ 누락',
      SUPABASE_DB_URL: process.env.SUPABASE_DB_URL ? '✅ 설정됨' : '❌ 누락',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ 설정됨' : '❌ 누락',
      BUCKET: process.env.BUCKET || '기본값: ingest',
      PREFIX: process.env.PREFIX || '기본값: incoming',
      NODE_ENV: process.env.NODE_ENV || '기본값: development'
    };

    // Supabase 연결 테스트
    let supabaseTest = '❌ 테스트 안됨';
    let supabaseError = '';
    
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY,
          { auth: { persistSession: false } }
        );
        
        // 더 간단한 연결 테스트 - auth.getUser() 사용
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          supabaseTest = '❌ 연결 실패';
          supabaseError = error.message;
        } else {
          supabaseTest = '✅ 연결 성공';
          supabaseError = '사용자 정보 없음 (정상)';
        }
      } catch (e: any) {
        supabaseTest = '❌ 오류 발생';
        supabaseError = e.message;
      }
    }

    return NextResponse.json({
      status: 'success',
      message: '환경변수 테스트 완료',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      supabase_test: supabaseTest,
      supabase_error: supabaseError
    });

  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
