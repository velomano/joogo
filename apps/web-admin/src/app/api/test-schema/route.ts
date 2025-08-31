export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 1. items 테이블 스키마 확인
    let schemaInfo = '스키마 정보 조회 성공';
    let columns: string[] = [];
    
    try {
      const { data: schemaData, error: schemaError } = await supabase
        .from('items')
        .select('*')
        .limit(1);
      
      if (schemaError) {
        schemaInfo = `스키마 오류: ${schemaError.message}`;
      } else {
        if (schemaData && schemaData.length > 0) {
          columns = Object.keys(schemaData[0]);
        }
      }
    } catch (e: any) {
      schemaInfo = `스키마 예외: ${e.message}`;
    }

    // 2. 간단한 테스트 데이터 삽입 시도 (올바른 UUID와 데이터 타입)
    let insertTest = '삽입 테스트 실패';
    let testData: any = null;
    
    try {
      // 올바른 UUID 형식과 데이터 타입으로 테스트
      const testRow = {
        tenant_id: '84949b3c-2cb7-4c42-b9f9-d1f37d371e00', // 올바른 UUID 형식
        barcode: 12345, // bigint 타입
        product_name: '테스트 상품',
        qty: 1,
        channel: 'test',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('items')
        .insert(testRow)
        .select();

      if (insertError) {
        insertTest = `삽입 오류: ${insertError.message}`;
        
        // 오류 상세 정보 추가
        if (insertError.details) {
          insertTest += ` (상세: ${insertError.details})`;
        }
        if (insertError.hint) {
          insertTest += ` (힌트: ${insertError.hint})`;
        }
      } else {
        insertTest = '삽입 테스트 성공';
        testData = insertData;
        
        // 성공 시 컬럼 정보 업데이트
        if (insertData && insertData.length > 0) {
          columns = Object.keys(insertData[0]);
        }
      }
    } catch (e: any) {
      insertTest = `삽입 예외: ${e.message}`;
    }

    // 3. 테이블에 데이터가 있는지 확인
    let dataCheck = '데이터 확인 실패';
    let rowCount = 0;
    
    try {
      const { count, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        dataCheck = `카운트 오류: ${countError.message}`;
      } else {
        dataCheck = '데이터 확인 성공';
        rowCount = count || 0;
      }
    } catch (e: any) {
      dataCheck = `카운트 예외: ${e.message}`;
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      schema: {
        status: schemaInfo,
        columns: columns,
        column_count: columns.length
      },
      data_status: {
        check: dataCheck,
        row_count: rowCount
      },
      insert_test: {
        status: insertTest,
        test_data: testData
      },
      environment: {
        supabase_url: supabaseUrl,
        supabase_key_length: supabaseKey?.length || 0
      },
      recommendations: [
        "tenant_id는 올바른 UUID 형식이어야 함",
        "barcode 필드가 bigint 타입이므로 숫자만 입력 가능",
        "테이블에 데이터가 없어서 컬럼 정보를 가져올 수 없음",
        "먼저 간단한 데이터를 삽입하여 스키마 확인 필요"
      ]
    });

  } catch (error: any) {
    console.error('Schema test API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
