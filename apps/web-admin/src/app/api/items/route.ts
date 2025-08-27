import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // Supabase 클라이언트 생성
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // items 테이블에서 데이터 조회 (테이블이 없으면 빈 배열 반환)
    let items = [];
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Items table query failed:', error.message);
        // 테이블이 없어도 오류로 처리하지 않음
      } else {
        items = data || [];
      }
    } catch (e) {
      console.warn('Items table not found, returning empty array');
    }

    // daily_sales 테이블에서도 데이터 조회 시도
    let sales = [];
    try {
      const { data, error } = await supabase
        .from('daily_sales')
        .select('*')
        .eq('tenant_id', tenant_id)
        .order('sales_date', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('Daily sales table query failed:', error.message);
      } else {
        sales = data || [];
      }
    } catch (e) {
      console.warn('Daily sales table not found');
    }

    return NextResponse.json({
      items: items,
      sales: sales,
      total_items: items.length,
      total_sales: sales.length
    });

  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


