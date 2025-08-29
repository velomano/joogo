import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 환경 변수 로드 헬퍼 함수
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`환경 변수가 누락되었습니다. SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseKey}`);
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

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

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    let items: any[] = [];
    let totalCount = 0;
    
    try {
      // 전체 개수 확인 (검색 조건 포함)
      let countQuery = supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      // 검색 조건이 있으면 추가
      if (search.trim()) {
        // barcode는 숫자이므로 정확한 매칭만, 나머지는 ilike로 검색
        if (/^\d+$/.test(search.trim())) {
          // 숫자만 입력된 경우: barcode 정확한 매칭
          countQuery = countQuery.eq('barcode', parseInt(search.trim()));
        } else {
          // 텍스트인 경우: product_name과 productname만 검색
          countQuery = countQuery.or(`product_name.ilike.%${search}%,productname.ilike.%${search}%`);
        }
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.warn('Count query failed:', countError.message);
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
          // 숫자만 입력된 경우: barcode 정확한 매칭
          searchQuery = searchQuery.eq('barcode', parseInt(search.trim()));
        } else {
          // 텍스트인 경우: product_name과 productname만 검색
          searchQuery = searchQuery.or(`product_name.ilike.%${search}%,productname.ilike.%${search}%`);
        }
        
        const { data, error } = await searchQuery.order('updated_at', { ascending: false });
        
        if (error) { 
          console.warn('Search query failed:', error.message); 
          items = [];
        } else { 
          items = data || []; 
          console.log(`[items] Search found ${items.length} items for query: "${search}"`);
        }
      } else {
        // 검색어가 없으면 페이지네이션으로 조회
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('tenant_id', tenant_id)
          .order('updated_at', { ascending: false })
          .range(from, to);
        
        if (error) { 
          console.warn('Items query failed:', error.message); 
          items = [];
        } else { 
          items = data || []; 
          console.log(`[items] Retrieved ${items.length} items from database (page: ${page}, limit: ${limit}, range: ${from}-${to})`);
        }
      }
      
    } catch (e) { 
      console.warn('Items table not found, returning empty array'); 
      items = [];
    }

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil(totalCount / limit);
    
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
    console.error('Items API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}


