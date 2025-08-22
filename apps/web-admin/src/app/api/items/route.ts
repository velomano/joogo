import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env for monorepo
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || process.env.NEXT_PUBLIC_TENANT_ID || '';
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) return NextResponse.json({ error: 'supabaseUrl missing' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'supabase service key missing' }, { status: 500 });

    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });
    
    // RPC 대신 직접 테이블 조회 (public.items 사용)
            const { data, error } = await supabase
          .from('items')
          .select('barcode, product_name, option_name, qty, unit_price_krw, revenue_krw, channel, sale_date, updated_at, created_at')
          .eq('tenant_id', tenantId)
          .order('updated_at', { ascending: false });
      
    if (error) throw error;

            const rows = (data || []).map((r: any) => ({
          barcode: r.barcode,
          product_name: r.product_name || r.productName,
          option_name: r.option_name,
          qty: r.qty,
          unit_price_krw: r.unit_price_krw,
          revenue_krw: r.revenue_krw,
          channel: r.channel,
          sale_date: r.sale_date,
          updated_at: r.updated_at,
          created_at: r.created_at,
        }));

    return NextResponse.json({ items: rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || process.env.NEXT_PUBLIC_TENANT_ID || '';
    if (!tenantId) {
      return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) return NextResponse.json({ error: 'supabaseUrl missing' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'supabase service key missing' }, { status: 500 });

    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });
    
    // RPC 대신 직접 테이블 삭제 (public.items 사용)
    const { data, error } = await supabase
      .from('items')
      .delete()
      .eq('tenant_id', tenantId);
      
    if (error) throw error;
    return NextResponse.json({ reset: data ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


