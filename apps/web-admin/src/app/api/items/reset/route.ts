
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export async function POST(request: NextRequest) {
  try {
    const { tenant_id } = await request.json();
    
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

    let deletedCount = 0;
    const errors: string[] = [];

    // 1. items 테이블에서 해당 tenant_id 데이터 삭제
    try {
      const { error: itemsError } = await supabase
        .from('items')
        .delete()
        .eq('tenant_id', tenant_id);

      if (itemsError) {
        errors.push(`Items table: ${itemsError.message}`);
      } else {
        deletedCount++;
      }
    } catch (e) {
      console.warn('Items table not found or error occurred');
    }

    // 2. daily_sales 테이블에서 해당 tenant_id 데이터 삭제
    try {
      const { error: salesError } = await supabase
        .from('daily_sales')
        .delete()
        .eq('tenant_id', tenant_id);

      if (salesError) {
        errors.push(`Daily sales table: ${salesError.message}`);
      } else {
        deletedCount++;
      }
    } catch (e) {
      console.warn('Daily sales table not found or error occurred');
    }

    // 3. order_inventory 테이블에서 해당 tenant_id 데이터 삭제
    try {
      const { error: inventoryError } = await supabase
        .from('order_inventory')
        .delete()
        .eq('tenant_id', tenant_id);

      if (inventoryError) {
        errors.push(`Order inventory table: ${inventoryError.message}`);
      } else {
        deletedCount++;
      }
    } catch (e) {
      console.warn('Order inventory table not found or error occurred');
    }

    // 4. 기타 관련 테이블들도 시도
    const otherTables = ['products', 'options', 'prices'];
    for (const tableName of otherTables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('tenant_id', tenant_id);

        if (!error) {
          deletedCount++;
        }
      } catch (e) {
        // 테이블이 없으면 무시
      }
    }

    if (errors.length > 0) {
      console.warn('Some tables had errors during reset:', errors);
    }

    return NextResponse.json({
      success: true,
      message: `데이터 초기화 완료`,
      deleted_tables: deletedCount,
      tenant_id: tenant_id,
      warnings: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('Reset error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reset data' },
      { status: 500 }
    );
  }
}
