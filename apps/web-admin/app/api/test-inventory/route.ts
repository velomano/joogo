import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Test Inventory API called');
    
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    
    // 간단한 테스트 쿼리
    const sb = supaAdmin();
    const { data, error } = await sb
      .from('fact_sales')
      .select('sku, product_name, qty, revenue')
      .eq('tenant_id', tenantId)
      .limit(5);

    if (error) {
      console.error('Test query error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Test query success, data count:', data?.length || 0);
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
