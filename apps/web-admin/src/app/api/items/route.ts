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

    let items = [];
    let totalCount: number | string = 'unknown';
    
    try {
      // 먼저 전체 개수 확인 (검색 조건 포함)
      let countQuery = supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      // 검색 조건이 있으면 추가
      if (search.trim()) {
        countQuery = countQuery.or(`product_name.ilike.%${search}%,barcode.ilike.%${search}%,productname.ilike.%${search}%`);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        console.warn('Count query failed:', countError.message);
        totalCount = 'unknown';
      } else {
        totalCount = count || 0;
        console.log(`[items] Total count for tenant ${tenant_id}: ${totalCount}`);
      }

      // 페이지네이션을 위한 range 계산
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      
      // 검색 조건과 페이지네이션을 적용한 데이터 조회
      let itemsQuery = supabase
        .from('items')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('updated_at', { ascending: false })
        .range(from, to);
      
      // 검색 조건이 있으면 추가
      if (search.trim()) {
        itemsQuery = itemsQuery.or(`product_name.ilike.%${search}%,barcode.ilike.%${search}%,productname.ilike.%${search}%`);
      }
      
      const { data, error } = await itemsQuery;
      
      if (error) { 
        console.warn('Items table query failed:', error.message); 
      } else { 
        items = data || []; 
        console.log(`[items] Retrieved ${items.length} items from database (page: ${page}, limit: ${limit}, range: ${from}-${to})`);
      }
      
    } catch (e) { 
      console.warn('Items table not found, returning empty array'); 
    }

    let sales = [];
    try {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('sales_date', { ascending: false })
        .limit(100);
      if (error) { console.warn('Daily sales table query failed:', error.message); } else { sales = data || []; }
    } catch (e) { console.warn('Daily sales table not found'); }

    // 페이지네이션 정보 계산
    const totalPages = Math.ceil((totalCount as number) / limit);
    
    // 상세한 통계 정보 반환
    return NextResponse.json({ 
      items: items, 
      sales: sales, 
      total_items: items.length,
      total_count: totalCount, // 실제 DB에 저장된 총 개수
      total_sales: sales.length,
      tenant_id: tenant_id,
      page: page,
      limit: limit,
      total_pages: totalPages,
      retrieved_at: new Date().toISOString(),
      note: totalCount !== 'unknown' && totalCount !== items.length ? 
        `⚠️ 주의: DB에는 ${totalCount}개가 저장되어 있지만, 조회된 것은 ${items.length}개입니다.` : 
        '정상적으로 페이지네이션이 적용되었습니다.'
    });
    
  } catch (error: any) {
    console.error('Items API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch items' },
      { status: 500 }
    );
  }
}


