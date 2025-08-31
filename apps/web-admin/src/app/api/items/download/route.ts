
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    console.log(`[DOWNLOAD] Starting download for tenant: ${tenant_id}`);

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    let items: any[] = [];
    
    try {
      console.log(`[DOWNLOAD] Fetching all items for tenant: ${tenant_id}`);
      
      // 먼저 전체 개수 확인
      const { count } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      console.log(`[DOWNLOAD] Total items count: ${count}`);
      
      // 배치 처리로 전체 데이터 가져오기
      let allItems: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        console.log(`[DOWNLOAD] Fetching batch at offset: ${offset}`);
        
        const { data: batchData, error: batchError } = await supabase
          .from('items')
          .select('*')
          .eq('tenant_id', tenant_id)
          .order('updated_at', { ascending: false })
          .range(offset, offset + batchSize - 1);
        
        if (batchError) {
          console.error(`[ERROR] Batch query failed at offset ${offset}:`, batchError);
          break;
        }
        
        if (!batchData || batchData.length === 0) {
          hasMore = false;
        } else {
          allItems = allItems.concat(batchData);
          offset += batchSize;
          
          console.log(`[DOWNLOAD] Batch ${Math.floor(offset/batchSize)}: ${batchData.length} items, total: ${allItems.length}`);
          
          if (batchData.length < batchSize) {
            hasMore = false;
          }
        }
        
        // 무한 루프 방지
        if (offset > 100000) {
          console.warn('[DOWNLOAD] Safety limit reached, stopping pagination');
          break;
        }
      }
      
      items = allItems;
      console.log(`[DOWNLOAD] Batch processing completed: ${items.length} items`);
      
    } catch (e) { 
      console.error('[ERROR] Items query exception:', e); 
      items = [];
    }

    console.log(`[DOWNLOAD] Final items count: ${items.length}`);

    if (items.length === 0) {
      return NextResponse.json({ error: 'No data found' }, { status: 404 });
    }

    // CSV 헤더 생성 (한글)
    const headers = [
      '바코드',
      '상품명',
      '옵션명',
      '재고수량',
      '판매가',
      '원가',
      '카테고리',
      '공급업체',
      '안전재고',
      '업데이트일'
    ];

    // CSV 데이터 생성
    const csvRows = [headers];
    
    items.forEach(item => {
      const row = [
        item.barcode || '',
        item.product_name || item.productname || '',
        item.option_name || item.option || '',
        item.qty || 0,
        item.selling_price || item.price || '',
        item.cost_price || '',
        item.product_category || item.category || '',
        item.supplier_name || '',
        item.safety_stock || '',
        item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : ''
      ];
      
      csvRows.push(row);
    });

    console.log(`[DOWNLOAD] CSV rows: ${csvRows.length} (headers + ${items.length} data rows)`);

    // CSV 문자열 생성 (한글 안전 처리)
    const csvContent = csvRows
      .map(row => 
        row.map(cell => {
          const cellStr = String(cell || '');
          // 특수문자 처리 및 CSV 이스케이프
          return `"${cellStr.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '')}"`;
        }).join(',')
      )
      .join('\n');

    // BOM 추가 (Excel에서 한글이 깨지지 않도록)
    const bom = '\uFEFF';
    const csvWithBom = bom + csvContent;

    // 파일명 생성
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `재고목록_${tenant_id}_${timestamp}.csv`;

    console.log(`[DOWNLOAD] Sending CSV response: ${items.length} items, filename: ${filename}`);

    // CSV 다운로드 응답
    return new NextResponse(csvWithBom, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Content-Type-Options': 'nosniff'
      }
    });

  } catch (error: any) {
    console.error('[ERROR] Download API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate CSV' },
      { status: 500 }
    );
  }
}
