import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || process.env.NEXT_PUBLIC_TENANT_ID || '';
    const includeRecent = searchParams.get('recent') === '1';
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) return NextResponse.json({ error: 'supabaseUrl missing' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'supabase service key missing' }, { status: 500 });

    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });
    const { data, error } = await supabase.rpc('sales_summary_monthly', { _tenant_id: tenantId });
    if (error) throw error;
    let recent: any[] = [];
    if (includeRecent) {
      const r = await supabase.rpc('sales_recent', { _tenant_id: tenantId, _limit: 50 });
      if (r.error) throw r.error;
      recent = r.data || [];
    }
    return NextResponse.json({ rows: data ?? [], recent });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


