import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenant_id = formData.get('tenant_id') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    console.log(`[UPLOAD] Starting upload for tenant: ${tenant_id}, file: ${file.name}, size: ${file.size}`);

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // 파일을 Supabase Storage에 업로드
    const fileName = `${tenant_id}/${Date.now()}_${file.name}`;
    const buffer = await file.arrayBuffer();
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('csv-uploads')
      .upload(fileName, buffer, {
        contentType: file.type || 'text/csv',
        cacheControl: '3600'
      });

    if (uploadError) {
      console.error('Storage upload failed:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file to storage' },
        { status: 500 }
      );
    }

    console.log(`[UPLOAD] File uploaded to storage: ${fileName}`);

    // ingest-worker에 작업 요청을 위한 작업 레코드 생성
    const { data: jobData, error: jobError } = await supabase
      .from('ingest_jobs')
      .insert({
        tenant_id,
        file_name: fileName,
        file_size: file.size,
        status: 'pending',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation failed:', jobError);
      return NextResponse.json(
        { error: 'Failed to create ingest job' },
        { status: 500 }
      );
    }

    console.log(`[UPLOAD] Job created: ${jobData.id}`);

    // 직접 CSV 파싱 수행 (ingest-worker 대신)
    try {
      console.log(`[UPLOAD] Starting direct CSV parsing...`);
      
      // CSV 내용을 텍스트로 읽기
      const csvText = new TextDecoder().decode(buffer);
      const lines = csvText.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('CSV file must have at least header and one data row');
      }

      // 헤더 파싱
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      console.log(`[UPLOAD] CSV headers: ${headers.join(', ')}`);
      
      // 데이터 행 파싱
      const dataRows = lines.slice(1).filter(line => line.trim());
      console.log(`[UPLOAD] Data rows: ${dataRows.length}`);
      
      // 데이터를 items 테이블에 삽입
      let inserted = 0;
      let skipped = 0;
      
      for (const line of dataRows) {
        try {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
          if (values.length < headers.length) continue;
          
          const itemData: any = {
            tenant_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          // 헤더에 따라 데이터 매핑 (실제 CSV 헤더에 맞춤)
          headers.forEach((header, index) => {
            const value = values[index] || '';
            
            // 디버깅: 첫 번째 행의 헤더 매핑 로깅
            if (inserted + skipped === 0) {
              console.log(`[UPLOAD] Header mapping: "${header}" (index: ${index}) -> value: "${value}"`);
            }
            
            switch (header.toLowerCase()) {
              case '바코드':
              case 'barcode':
              case '바코드번호':
              case '바코드 번호':
                // 바코드 값이 숫자가 아닌 경우 문자열로 저장
                const barcodeValue = value.trim();
                if (barcodeValue) {
                  // 숫자인 경우에만 parseInt, 아니면 문자열 그대로
                  itemData.barcode = isNaN(Number(barcodeValue)) ? barcodeValue : parseInt(barcodeValue);
                } else {
                  itemData.barcode = null;
                }
                break;
              case '상품명':
              case 'product_name':
              case 'productname':
              case '사입상품명':
              case '상품명':
                itemData.product_name = value.trim();
                break;
              case '옵션명':
              case 'option_name':
              case 'option':
              case '옵션내용':
              case '사입옵션명':
                itemData.option_name = value.trim();
                break;
              case '재고수량':
              case 'qty':
              case 'quantity':
              case '현재고':
                itemData.qty = parseInt(value) || 0;
                break;
              case '판매가':
              case 'selling_price':
              case 'price':
              case '대표판매가':
                itemData.selling_price = parseFloat(value) || null;
                break;
              case '원가':
              case 'cost_price':
              case 'cost':
                itemData.cost_price = parseFloat(value) || null;
                break;
              case '카테고리':
              case 'product_category':
              case 'category':
              case '상품분류':
                itemData.product_category = value.trim();
                break;
              case '공급업체':
              case 'supplier_name':
              case '공급처명':
                itemData.supplier_name = value.trim();
                break;
              case '안전재고':
              case 'safety_stock':
              case '안정재고':
                itemData.safety_stock = parseInt(value) || null;
                break;
            }
          });
          
          // 디버깅: 첫 번째 행만 상세 로깅
          if (inserted + skipped < 3) {
            console.log(`[UPLOAD] Row ${inserted + skipped + 1} data:`, {
              barcode: itemData.barcode,
              product_name: itemData.product_name,
              qty: itemData.qty,
              selling_price: itemData.selling_price,
              cost_price: itemData.cost_price
            });
          }
          
          // 필수 필드 확인 (barcode는 null이어도 허용, product_name만 필수)
          if (itemData.product_name) {
            // upsert로 중복 방지
            const { error: insertError } = await supabase
              .from('items')
              .upsert(itemData, { 
                onConflict: 'tenant_id,barcode',
                ignoreDuplicates: false 
              });
            
            if (insertError) {
              console.warn(`[UPLOAD] Row insert failed:`, insertError);
              skipped++;
            } else {
              inserted++;
            }
          } else {
            if (inserted + skipped < 3) {
              console.log(`[UPLOAD] Row ${inserted + skipped + 1} skipped - missing required fields:`, {
                hasBarcode: !!itemData.barcode,
                hasProductName: !!itemData.product_name,
                barcodeValue: itemData.barcode,
                productNameValue: itemData.product_name
              });
            }
            skipped++;
          }
          
        } catch (rowError) {
          console.warn(`[UPLOAD] Row parsing failed:`, rowError);
          skipped++;
        }
      }
      
      // 작업 상태 업데이트
      await supabase
        .from('ingest_jobs')
        .update({
          status: 'completed',
          progress: 100,
          message: `Direct parsing completed: ${inserted} inserted, ${skipped} skipped`,
          result: {
            total_rows: dataRows.length,
            inserted,
            skipped,
            date_columns: headers.length
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', jobData.id);
      
      console.log(`[UPLOAD] Direct parsing completed: ${inserted} inserted, ${skipped} skipped`);
      
    } catch (parseError: any) {
      console.error('[UPLOAD] Direct parsing failed:', parseError);
      
      // 작업 상태를 실패로 업데이트
      await supabase
        .from('ingest_jobs')
        .update({
          status: 'failed',
          progress: 0,
          message: `Direct parsing failed: ${parseError.message}`,
          error: parseError.message,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobData.id);
      
      return NextResponse.json({
        success: false,
        error: 'CSV parsing failed',
        job_id: jobData.id
      }, { status: 500 });
    }

    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      job_id: jobData.id,
      file_name: fileName,
      status: 'completed',
      message: 'File uploaded and parsed successfully'
    });

  } catch (error: any) {
    console.error('[UPLOAD] Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}


