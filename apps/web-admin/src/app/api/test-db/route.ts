export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Supabase 클라이언트 생성 - Service Role Key 우선, 실패시 Anon Key 사용
    const supabaseUrl = process.env.SUPABASE_URL;
    let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let keyType = 'service_role';
    
    // Service Role Key가 없거나 실패시 Anon Key 사용
    if (!supabaseKey) {
      supabaseKey = process.env.SUPABASE_ANON_KEY;
      keyType = 'anon';
      console.log('Falling back to anon key');
    }
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration missing',
        supabase_url: !!supabaseUrl,
        supabase_key: !!supabaseKey,
        key_type: keyType
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 1. 연결 테스트
    let connectionTest = '❌ 연결 실패';
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) {
        connectionTest = `❌ 인증 오류: ${authError.message}`;
      } else {
        connectionTest = '✅ 연결 성공';
      }
    } catch (e: any) {
      connectionTest = `❌ 연결 예외: ${e.message}`;
    }

    // 2. 테이블 존재 여부 확인
    const tables = ['items', 'daily_sales', 'order_inventory', 'products', 'options', 'prices'];
    const tableStatus: Record<string, any> = {};

    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          tableStatus[tableName] = {
            exists: false,
            error: error.message,
            code: error.code
          };
        } else {
          tableStatus[tableName] = {
            exists: true,
            columns: data && data.length > 0 ? Object.keys(data[0]) : [],
            sample_count: data?.length || 0
          };
        }
      } catch (e: any) {
        tableStatus[tableName] = {
          exists: false,
          error: e.message,
          type: 'exception'
        };
      }
    }

    // 3. 스키마 정보 조회 시도
    let schemaInfo = '스키마 정보 조회 실패';
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .rpc('get_schema_info')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        schemaInfo = `RPC 오류: ${schemaError.message}`;
      } else {
        schemaInfo = '스키마 정보 조회 성공';
      }
    } catch (e: any) {
      schemaInfo = `스키마 조회 예외: ${e.message}`;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      connection: connectionTest,
      key_type: keyType,
      environment: {
        supabase_url: supabaseUrl,
        supabase_key_length: supabaseKey?.length || 0,
        node_env: process.env.NODE_ENV
      },
      tables: tableStatus,
      schema: schemaInfo
    });

  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
