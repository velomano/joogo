import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
export const runtime = 'nodejs';

function parseDays(q: string): number | null {
  const m = q.match(/(\d{1,3})\s*(day|days|일)/i);
  if (m) return Math.max(1, Math.min(365, parseInt(m[1], 10)));
  if (/week|주/i.test(q)) return 7;
  if (/month|개월|달/i.test(q)) return 30;
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '')
      .trim();
    const tenantId = String(body.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '');
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
    const supabase = createClient(url, serviceKey, { db: { schema: 'public' } });

    // 아주 단순한 라우팅(데모): top / monthly
    const lower = question.toLowerCase();
    if (/(top|상위)/i.test(question)) {
      const days = parseDays(question) ?? 30;
      const limitMatch = question.match(/top\s*(\d+)/i);
      const limit = limitMatch ? Math.min(20, parseInt(limitMatch[1], 10)) : 5;
      const { data, error } = await supabase.rpc('sales_top_sku_days', { _tenant_id: tenantId, _days: days, _limit: limit });
      if (error) throw error;
      return NextResponse.json({ intent: 'top_sku_days', params: { days, limit }, rows: data ?? [] });
    }

    if (/(monthly|월별|trend|추세)/i.test(question)) {
      const { data, error } = await supabase.rpc('sales_summary_monthly', { _tenant_id: tenantId });
      if (error) throw error;
      return NextResponse.json({ intent: 'monthly_summary', rows: data ?? [] });
    }

    return NextResponse.json({ error: 'unsupported question. try: "최근 30일 top 5 sku" or "월별 매출 추세"' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


