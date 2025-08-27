import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { rows, type, tenant_id } = await request.json();
    
    console.log('Ingest API called with:', { 
      rows_count: rows?.length, 
      type, 
      tenant_id,
      sample_row: rows?.[0] 
    });
    
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 });
    }
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'No tenant_id provided' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    console.log('Environment check:', {
      supabase_url: !!supabaseUrl,
      supabase_key: !!supabaseKey,
      key_length: supabaseKey?.length
    });
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // items 테이블에 저장할 데이터 준비 (실제 스키마에 맞춤)
    const itemsData = [];
    
    for (const row of rows) {
      try {
        // 바코드 처리 (숫자로 변환)
        let barcode = 0;
        if (row['바코드번호']) {
          // 바코드에서 숫자만 추출
          const barcodeStr = String(row['바코드번호']).replace(/[^0-9]/g, '');
          barcode = parseInt(barcodeStr) || 0;
        }
        
        // 실제 테이블 스키마에 맞는 데이터만 포함
        const itemData = {
          tenant_id,
          barcode: barcode,
          productname: row['상품코드'] || null, // productname 컬럼에 상품코드 저장
          product_name: row['상품명'] || row['사입상품명'] || 'unknown',
          option_name: row['옵션내용'] || null,
          qty: parseInt(row['현재고'] || '0') || 0,
          channel: 'online', // 기본값
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // 추가 정보는 original_data에 JSON으로 저장
          original_data: {
            supplier_name: row['공급처명'] || null,
            supplier_code: row['공급처코드'] || null,
            category: row['상품분류'] || null,
            cost_price: parseFloat(row['원가'] || '0') || 0,
            selling_price: parseFloat(row['판매가'] || '0') || 0,
            location: row['상품위치'] || null,
            safety_stock: parseInt(row['안정재고'] || '0') || 0,
            order_amount: parseFloat(row['주문금액'] || '0') || 0,
            order_count: parseInt(row['주문수'] || '0') || 0,
            shipped_count: parseInt(row['발송수'] || '0') || 0,
            shipped_amount: parseFloat(row['발송금액'] || '0') || 0,
            inbound_qty: parseInt(row['입고수량'] || '0') || 0,
            outbound_qty: parseInt(row['출고수량'] || '0') || 0,
            shortage_qty: parseInt(row['부족수량'] || '0') || 0,
            description: row['상품설명'] || null,
            memo: row['상품메모5'] || null,
            // 날짜별 데이터도 포함
            daily_data: Object.keys(row)
              .filter(key => /^\d{8}$/.test(key))
              .reduce((acc: Record<string, number>, dateKey) => {
                acc[dateKey] = parseInt(row[dateKey] || '0') || 0;
                return acc;
              }, {})
          }
        };
        
        itemsData.push(itemData);
        
      } catch (rowError) {
        console.error('Row processing error:', rowError, 'Row:', row);
        // 개별 행 오류는 건너뛰고 계속 진행
        continue;
      }
    }

    console.log('Processed items data sample:', itemsData[0]);
    console.log('Total items to insert:', itemsData.length);

    // items 테이블에 데이터 삽입
    const { data: insertResult, error: insertError } = await supabase
      .from('items')
      .insert(itemsData)
      .select();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return NextResponse.json({ 
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      }, { status: 500 });
    }
    
    console.log('Insert successful:', { 
      inserted_count: insertResult?.length, 
      table: 'items'
    });

    // 날짜별 데이터 개수 확인
    const dateColumns = Object.keys(rows[0]).filter(key => /^\d{8}$/.test(key));
    console.log('Date columns found:', dateColumns.length);

    return NextResponse.json({
      success: true,
      inserted: insertResult?.length || itemsData.length,
      table: 'items',
      tenant_id,
      date_columns: dateColumns.length,
      message: `${itemsData.length}개 상품이 items 테이블에 저장되었습니다. 날짜별 데이터 ${dateColumns.length}개 컬럼은 original_data에 포함되었습니다.`
    });

  } catch (error: any) {
    console.error('Ingest API exception:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to ingest data',
        stack: error.stack,
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}
