export const runtime = 'edge';
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
    let skippedRows = 0;
    let processedRows = 0;
    
    for (const row of rows) {
      try {
        // 바코드 처리 (숫자로 변환, 하이픈 제거)
        let barcode = 0;
        if (row['바코드번호']) {
          // 바코드에서 숫자만 추출 (하이픈, 공백 등 제거)
          const barcodeStr = String(row['바코드번호']).replace(/[^0-9]/g, '');
          barcode = parseInt(barcodeStr) || 0;
        }
        
        // 바코드가 유효하지 않으면 건너뛰기
        if (barcode === 0) {
          console.warn('Invalid barcode, skipping row:', row['바코드번호']);
          skippedRows++;
          continue;
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
        processedRows++;
        
      } catch (rowError) {
        console.error('Row processing error:', rowError, 'Row:', row);
        skippedRows++;
        continue;
      }
    }

    console.log('Processed items data sample:', itemsData[0]);
    console.log('Total items to insert:', itemsData.length);
    console.log('Skipped rows:', skippedRows);

    if (itemsData.length === 0) {
      return NextResponse.json({ 
        error: 'No valid data to insert after processing',
        processed: 0,
        skipped: skippedRows
      }, { status: 400 });
    }

    // UPSERT 방식으로 데이터 삽입 (중복 시 업데이트)
    const { data: insertResult, error: insertError } = await supabase
      .from('items')
      .upsert(itemsData, { 
        onConflict: 'tenant_id,barcode',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('Database upsert error:', insertError);
      return NextResponse.json({ 
        error: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code,
        processed: processedRows,
        skipped: skippedRows
      }, { status: 500 });
    }
    
    console.log('Upsert successful:', { 
      inserted_count: insertResult?.length, 
      table: 'items',
      processed: processedRows,
      skipped: skippedRows
    });

    // 날짜별 데이터 개수 확인
    const dateColumns = Object.keys(rows[0]).filter(key => /^\d{8}$/.test(key));
    console.log('Date columns found:', dateColumns.length);

    return NextResponse.json({
      success: true,
      inserted: insertResult?.length || itemsData.length,
      processed: processedRows,
      skipped: skippedRows,
      table: 'items',
      tenant_id,
      date_columns: dateColumns.length,
      message: `${processedRows}개 상품이 처리되었습니다. ${insertResult?.length || itemsData.length}개가 저장되었습니다. ${skippedRows}개 행이 건너뛰어졌습니다.`
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
