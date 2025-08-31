import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('q') || '';
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ 
        error: 'Supabase configuration missing',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    let items: any[] = [];
    let totalCount = 0;
    
    try {
      // 전체 개수 확인
      const { count, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      if (countError) {
        console.error('[ERROR] Count query failed:', countError);
        totalCount = 0;
      } else {
        totalCount = count || 0;
        console.log(`[items] Total count for tenant ${tenant_id}: ${totalCount}`);
      }

      // 검색 조건이 있으면 필터링된 데이터만 조회
      if (search.trim()) {
        let searchQuery = supabase
          .from('items')
          .select('*')
          .eq('tenant_id', tenant_id);
        
        // barcode는 숫자이므로 정확한 매칭만, 나머지는 ilike로 검색
        if (/^\d+$/.test(search.trim())) {
          searchQuery = searchQuery.eq('barcode', parseInt(search.trim()));
        } else {
          searchQuery = searchQuery.or(`product_name.ilike.%${search}%,productname.ilike.%${search}%`);
        }
        
        const { data, error } = await searchQuery.order('updated_at', { ascending: false });
        
        if (error) { 
          console.error('[ERROR] Search query failed:', error); 
          items = [];
        } else { 
          items = data || []; 
          console.log(`[items] Search found ${items.length} items for query: "${search}"`);
        }
      } else {
        // 검색어가 없으면 페이지네이션으로 조회 (sales-summary와 동일한 방식)
        let allItems: any[] = [];
        let offset = 0;
        const batchSize = 1000;
        let hasMore = true;
        
        while (hasMore) {
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
            
            if (batchData.length < batchSize) {
              hasMore = false;
            }
          }
          
          // 무한 루프 방지
          if (offset > 100000) {
            console.warn('Safety limit reached, stopping pagination');
            break;
          }
        }
        
        items = allItems;
        console.log(`[items] Retrieved ${items.length} items via pagination (${Math.ceil(offset / batchSize)} batches)`);
        
        // 페이지네이션 적용
        const from = (page - 1) * limit;
        const to = from + limit;
        items = items.slice(from, to);
      }
      
    } catch (e) { 
      console.error('[ERROR] Items table query exception:', e); 
      items = [];
    }

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log('[DEBUG] API response prepared:', {
      itemsCount: items.length,
      totalCount,
      totalPages,
      tenant_id
    });
    
    // 상세한 통계 정보 반환
    return NextResponse.json({ 
      items: items, 
      total_items: items.length,
      total_count: totalCount,
      tenant_id: tenant_id,
      page: page,
      limit: limit,
      total_pages: totalPages,
      retrieved_at: new Date().toISOString(),
      note: totalCount > 0 ? 
        `정상적으로 조회되었습니다. (총 ${totalCount}개 중 ${items.length}개 표시)` : 
        '데이터가 없습니다.'
    });
    
  } catch (error: any) {
    console.error('[ERROR] Items API error:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Unknown error',
        type: error.constructor.name
      },
      { status: 500 }
    );
  }
}


