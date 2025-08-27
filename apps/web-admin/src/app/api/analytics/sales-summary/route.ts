import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
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
    let totalCount = 0;
    
    try {
      // 전체 개수 확인
      const { count, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      if (countError) {
        console.warn('Count query failed:', countError.message);
        totalCount = 0;
      } else {
        totalCount = count || 0;
      }

      // 제한 없이 모든 데이터 조회 (판매분석용) - range 사용으로 PostgREST 기본 제한 우회
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('qty', { ascending: false })
        .range(0, 999999); // range 사용으로 PostgREST 기본 제한 완전 우회
      
      if (error) { 
        console.warn('Items query failed:', error.message); 
        items = [];
      } else { 
        items = data || []; 
        console.log(`[sales-summary] Retrieved ${items.length} items from database (range: 0-999999)`);
      }
      
    } catch (e) { 
      console.warn('Items table not found'); 
      items = [];
    }

    // 통계 계산
    const totalQuantity = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const averageQuantity = totalCount > 0 ? Math.round(totalQuantity / totalCount) : 0;
    const lowStockItems = items.filter(item => (item.qty || 0) < 10);
    const outOfStockItems = items.filter(item => (item.qty || 0) === 0);
    const sufficientStockItems = items.filter(item => (item.qty || 0) >= 50);

    // Top 10 재고 상품
    const topStockItems = items
      .sort((a, b) => (b.qty || 0) - (a.qty || 0))
      .slice(0, 10)
      .map(item => ({
        barcode: item.barcode,
        product_name: item.product_name || item.productname || '상품명 없음',
        qty: item.qty || 0,
        updated_at: item.updated_at
      }));

    // 부족 재고 상품 (10개 미만)
    const lowStockList = lowStockItems.map(item => ({
      barcode: item.barcode,
      product_name: item.product_name || item.productname || '상품명 없음',
      qty: item.qty || 0,
      status: (item.qty || 0) === 0 ? '품절' : '부족',
      updated_at: item.updated_at
    }));

    // 전체 상품 목록 (상태 포함)
    const allItemsList = items.map(item => ({
      barcode: item.barcode,
      product_name: item.product_name || item.productname || '상품명 없음',
      qty: item.qty || 0,
      status: (item.qty || 0) === 0 ? '품절' : 
              (item.qty || 0) < 10 ? '부족' : 
              (item.qty || 0) >= 50 ? '충분' : '보통',
      updated_at: item.updated_at
    }));

    return NextResponse.json({
      summary: {
        total_items: totalCount,
        total_quantity: totalQuantity,
        average_quantity: averageQuantity,
        low_stock_count: lowStockItems.length,
        out_of_stock_count: outOfStockItems.length,
        sufficient_stock_count: sufficientStockItems.length
      },
      top_stock_items: topStockItems,
      low_stock_items: lowStockList,
      all_items: allItemsList,
      tenant_id: tenant_id,
      retrieved_at: new Date().toISOString(),
      note: `전체 ${totalCount}개 상품의 통계 데이터입니다. (조회된 항목: ${items.length}개)`
    });
    
  } catch (error: any) {
    console.error('Sales Summary API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales summary' },
      { status: 500 }
    );
  }
}
