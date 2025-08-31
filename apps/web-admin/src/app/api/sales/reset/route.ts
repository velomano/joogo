export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tenantId } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    const supabase = createServerClient();
    
    // 해당 tenant의 sales 데이터 삭제
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('Sales reset error:', error);
      return NextResponse.json({ error: 'Failed to reset sales' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Sales reset successfully',
      tenantId 
    });

  } catch (error: any) {
    console.error('Reset API error:', error);
    return NextResponse.json({ 
      error: error?.message || 'Reset failed' 
    }, { status: 500 });
  }
}

// Supabase 클라이언트 생성
function createServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url) throw new Error('SUPABASE_URL is required');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE is required');
  
  return createClient(url, serviceKey);
}
