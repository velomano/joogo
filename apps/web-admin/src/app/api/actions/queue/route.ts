import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenant_id = searchParams.get('tenant_id') || '';

  if (!tenant_id) {
    return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
  }

  // 환경변수 확인
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase 환경변수가 설정되지 않았습니다:', {
      SUPABASE_URL: !!supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: !!supabaseKey
    });
    return NextResponse.json({ 
      error: 'Supabase 환경변수가 설정되지 않았습니다. SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.' 
    }, { status: 500 });
  }

  try {
    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 먼저 items 테이블에서 기본 데이터 확인
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('barcode, qty, created_at, product_name, option_name, unit_price_krw, channel, tenant_id')
      .eq('tenant_id', tenant_id)
      .limit(1000);

    if (itemsError) {
      console.error('Items 테이블 조회 오류:', itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 400 });
    }

    if (!items || items.length === 0) {
      return NextResponse.json({ 
        message: '데이터가 없습니다. 먼저 CSV를 업로드해주세요.',
        items_count: 0 
      });
    }

    console.log(`Items 테이블에서 ${items.length}개 행을 찾았습니다.`);

    // 간단한 Action Queue 생성 (뷰 없이)
    const cards: any[] = [];
    
    // 재고 부족 상품 찾기
    const lowStockItems = items.filter(item => 
      (item.qty || 0) < 10 && (item.qty || 0) > 0
    );

    lowStockItems.forEach(item => {
      cards.push({
        type: 'replenishment',
        sku_id: item.barcode,
        priority: 100,
        reason: `재고 부족: 현재 ${item.qty || 0}개`,
        expected_effect: '재고 보충으로 품절 방지',
        explain: { 
          on_hand: item.qty || 0,
          abc_class: 'A'
        },
        ctas: ['simulate', 'approve', 'snooze']
      });
    });

    // 비활성 상품 찾기 (최근 30일간 판매 없음)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const inactiveItems = items.filter(item => {
      const lastSaleDate = new Date(item.created_at);
      return lastSaleDate < thirtyDaysAgo && (item.qty || 0) > 0;
    });

    inactiveItems.forEach(item => {
      cards.push({
        type: 'discontinue',
        sku_id: item.barcode,
        priority: 80,
        reason: `30일간 미판매 / 재고 ${item.qty || 0}개`,
        expected_effect: '장기 체류 재고 축소',
        risk: '과도한 가격 인하 시 마진 악화',
        explain: { 
          on_hand: item.qty || 0,
          last_sale_date: item.created_at.split('T')[0]
        },
        ctas: ['simulate', 'approve', 'snooze']
      });
    });

    return NextResponse.json({
      cards: cards.sort((a, b) => b.priority - a.priority),
      summary: {
        total_items: items.length,
        low_stock_items: lowStockItems.length,
        inactive_items: inactiveItems.length,
        total_cards: cards.length
      }
    });

  } catch (error: any) {
    console.error('Action Queue 생성 오류:', error);
    return NextResponse.json({ 
      error: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
