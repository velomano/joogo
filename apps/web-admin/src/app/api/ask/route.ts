import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
export const runtime = 'nodejs';

// Safe SQL guard: 허용된 RPC 함수들만
const ALLOWED_RPCS = new Set([
  'sales_top_sku_days',
  'sales_summary_monthly', 
  'sales_recent',
  'sales_summary_monthly',
  'list_items'
]);

// 타임아웃 설정 (10초)
const QUERY_TIMEOUT = 10000;

function parseDays(q: string): number | null {
  const m = q.match(/(\d{1,3})\s*(day|days|일)/i);
  if (m) return Math.max(1, Math.min(365, parseInt(m[1], 10)));
  if (/week|주/i.test(q)) return 7;
  if (/month|개월|달/i.test(q)) return 30;
  if (/year|년|annual|연간/i.test(q)) return 365;
  return null;
}

function parseLimit(q: string): number {
  const limitMatch = q.match(/top\s*(\d+)/i);
  return limitMatch ? Math.min(20, parseInt(limitMatch[1], 10)) : 5;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const question = String(body.question || '').trim();
    const tenantId = String(body.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '');
    
    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    // Safe SQL guard: SQL 인젝션 방지
    if (/select|insert|update|delete|drop|create|alter/i.test(question)) {
      return NextResponse.json({ 
        error: 'SQL queries are not allowed. Use natural language questions only.',
        hint: 'Try: "최근 30일 top 5 sku", "월별 매출 추세", "올해 총매출"'
      }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });
    
    const supabase = createClient(url, serviceKey, { 
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-ask-api' } }
    });

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT);

    try {
      const lower = question.toLowerCase();
      
      // 1. top_sku_days: Top SKU by sales
      if (/(top|상위|베스트)/i.test(question)) {
        const days = parseDays(question) ?? 30;
        const limit = parseLimit(question);
        const { data, error } = await supabase.rpc('sales_top_sku_days', { 
          _tenant_id: tenantId, _days: days, _limit: limit 
        });
        if (error) throw error;
        return NextResponse.json({ 
          intent: 'top_sku_days', 
          type: 'chart',
          params: { days, limit }, 
          data: data ?? [],
          summary: `${days}일간 매출 Top ${limit} SKU`
        });
      }

      // 2. monthly_summary: 월별 매출 추세
      if (/(monthly|월별|trend|추세|월간)/i.test(question)) {
        const { data, error } = await supabase.rpc('sales_summary_monthly', { _tenant_id: tenantId });
        if (error) throw error;
        return NextResponse.json({ 
          intent: 'monthly_summary', 
          type: 'chart',
          data: data ?? [],
          summary: '월별 매출 추세'
        });
      }

      // 3. annual_total: 연간 총매출
      if (/(annual|연간|올해|year|총매출|total)/i.test(question)) {
        const { data, error } = await supabase.rpc('sales_summary_monthly', { _tenant_id: tenantId });
        if (error) throw error;
        const annualTotal = (data || []).reduce((sum, row) => sum + (row.total_sales || 0), 0);
        return NextResponse.json({ 
          intent: 'annual_total', 
          type: 'summary',
          data: { total: annualTotal, currency: 'KRW' },
          summary: '연간 총매출'
        });
      }

      // 4. mom_change: 전월 대비 증감
      if (/(mom|전월|증감|변화|비교)/i.test(question)) {
        const { data, error } = await supabase.rpc('sales_summary_monthly', { _tenant_id: tenantId });
        if (error) throw error;
        if (data && data.length >= 2) {
          const current = data[data.length - 1]?.total_sales || 0;
          const previous = data[data.length - 2]?.total_sales || 0;
          const change = current - previous;
          const changePercent = previous > 0 ? ((change / previous) * 100) : 0;
          return NextResponse.json({ 
            intent: 'mom_change', 
            type: 'summary',
            data: { current, previous, change, changePercent, currency: 'KRW' },
            summary: '전월 대비 매출 변화'
          });
        }
        return NextResponse.json({ error: 'insufficient data for MoM comparison' }, { status: 400 });
      }

      // 5. sku_trend: 특정 SKU 추세
      if (/(sku|SKU|추세|trend|패턴)/i.test(question)) {
        const skuMatch = question.match(/(SKU-\d+)/i);
        if (!skuMatch) {
          return NextResponse.json({ error: 'Please specify SKU (e.g., "SKU-1001 추세")' }, { status: 400 });
        }
        const sku = skuMatch[1];
        const { data, error } = await supabase.rpc('sales_recent', { _tenant_id: tenantId });
        if (error) throw error;
        const skuData = (data || []).filter(row => row.sku === sku);
        return NextResponse.json({ 
          intent: 'sku_trend', 
          type: 'chart',
          data: skuData,
          params: { sku },
          summary: `${sku} 매출 추세`
        });
      }

      // 6. summary: 총매출/평균단가 등 요약
      if (/(summary|요약|개요|overview)/i.test(question)) {
        const { data, error } = await supabase.rpc('sales_recent', { _tenant_id: tenantId });
        if (error) throw error;
        const totalSales = (data || []).reduce((sum, row) => sum + (row.total_price || 0), 0);
        const avgPrice = data && data.length > 0 ? totalSales / data.length : 0;
        const totalOrders = data ? new Set(data.map(row => row.order_id)).size : 0;
        return NextResponse.json({ 
          intent: 'summary', 
          type: 'summary',
          data: { totalSales, avgPrice, totalOrders, currency: 'KRW' },
          summary: '매출 요약 정보'
        });
      }

      return NextResponse.json({ 
        error: 'unsupported question. Try: "최근 30일 top 5 sku", "월별 매출 추세", "올해 총매출", "전월 대비 변화", "SKU-1001 추세", "매출 요약"' 
      }, { status: 400 });

    } finally {
      clearTimeout(timeoutId);
    }

  } catch (e: any) {
    if (e.name === 'AbortError') {
      return NextResponse.json({ error: 'Query timeout exceeded (10s)' }, { status: 408 });
    }
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


