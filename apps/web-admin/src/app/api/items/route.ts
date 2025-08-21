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
    const { data, error } = await supabase.rpc('list_items', { _tenant_id: tenantId });
    if (error) throw error;

    const rows = (data || []).map((r: any) => ({
      barcode: (r as any).barcode,
      product_name: (r as any).product_name,
      qty: (r as any).qty,
      updated_at: (r as any).updated_at,
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
    const { data, error } = await supabase.rpc('reset_items', { _tenant_id: tenantId });
    if (error) throw error;
    return NextResponse.json({ reset: data ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


