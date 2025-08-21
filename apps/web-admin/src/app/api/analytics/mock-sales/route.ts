import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env for monorepo
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const tenantId = String(body.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '');
    const days = Number(body.days ?? 7);
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url) return NextResponse.json({ error: 'supabaseUrl missing' }, { status: 500 });
    if (!serviceKey) return NextResponse.json({ error: 'supabase service key missing' }, { status: 500 });

    // Only use public RPC (function seeds products internally)
    const supabasePublic = createClient(url, serviceKey, { db: { schema: 'public' } });
    const { data, error } = await supabasePublic.rpc('generate_mock_sales', { _tenant_id: tenantId, _days: days });
    if (error) {
      return NextResponse.json({ error: error.message, hint: (error as any).hint, details: (error as any).details }, { status: 500 });
    }
    return NextResponse.json({ generated: data ?? 0 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


