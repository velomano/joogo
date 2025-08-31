import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';


export const dynamic = 'force-dynamic';

type ActionId =
  | 'sales_overview'          // 기간 총판매/매출/객단가
  | 'spike_days'              // 갑작스런 판매 급증 일자
  | 'trend_risers'            // 상승 추세 SKU
  | 'trend_decliners'         // 하락 추세 SKU
  | 'seasonality_weekday'     // 요일별 패턴
  | 'seasonality_month'       // 월별(또는 주차) 패턴
  | 'stockout_risk'           // 재고 소진 위험(ADS 기반 커버리지)
  | 'slow_movers'             // N일 무판매 & 재고>0
  | 'abc_class'               // ABC 매출 기여도 분류
  | 'price_outliers'          // 단가 이상치 탐지
  | 'channel_mix';            // 채널별 매출/수량 구성

type ApiReq = {
  action: ActionId;
  tenantId: string;
  params?: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ApiReq;
    if (!body?.tenantId) return NextResponse.json({ error: 'MISSING_TENANT' }, { status: 400 });

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !serviceKey) return NextResponse.json({ error: 'supabase env missing' }, { status: 500 });

    const supabase = createClient(url, serviceKey, { 
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-insights-api' } }
    });

    const { from, to } = ensureRange(body.params);
    const sales = await fetchSales(supabase, body.tenantId, from, to);
    const items = (await fetchItems(supabase, body.tenantId)) as Item[];
    
    // 디버깅 로그 추가
    console.log('Insights Debug:', {
      tenantId: body.tenantId,
      dateRange: { from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) },
      salesCount: sales.length,
      itemsCount: items.length,
      sampleSales: sales.slice(0, 3),
      sampleItems: items.slice(0, 3)
    });

    switch (body.action) {
      case 'sales_overview': {
        const units = sumBy(sales, r => r.qty);
        const revenue = sumBy(sales, r => r.revenue);
        const orders = sales.length; // 집계행 기준
        const aov = orders ? Math.round(revenue / orders) : 0;
        return NextResponse.json({
          action: body.action,
          answer_ko: `판매 ${fmt(units)}개, 매출 ${fmtKRW(revenue)}, 객단가 ${fmtKRW(aov)}`,
          stats: { units, revenue, orders, aov, from: from.toISOString().slice(0,10), to: to.toISOString().slice(0,10) },
        });
      }

      case 'spike_days': {
        const minQty = num(body.params?.minQty, 5);
        const ratio = num(body.params?.ratio, 2.5); // 현재/기준(7일평균)
        const bySku = groupBy(sales, r => String(r.barcode));
        const spikes: any[] = [];
        for (const [barcode, rows] of Object.entries(bySku)) {
          const daily = rollupDaily(rows);
          const keys = Object.keys(daily).sort();
          const series = keys.map(k => ({ d: k, q: daily[k] }));
          for (let i = 0; i < series.length; i++) {
            const prev7 = series.slice(Math.max(0, i - 7), i);
            const base = avg(prev7.map(x => x.q)) || 0;
            const today = series[i].q;
            if (today >= minQty && base > 0 && today / base >= ratio) {
              spikes.push({
                barcode,
                productName: rows[0]?.productName ?? '',
                date: series[i].d,
                qty: today,
                baseline: Math.round(base),
                ratio: +(today / base).toFixed(2),
              });
            }
          }
        }
        spikes.sort((a, b) => b.ratio - a.ratio);
        return NextResponse.json({ action: body.action, rows: spikes.slice(0, 200), meta: { minQty, ratio } });
      }

      case 'trend_risers':
      case 'trend_decliners': {
        const topN = clampInt(body.params?.topN, 20, 1, 200);
        const bySku = groupBy(sales, r => String(r.barcode));
        const list: any[] = [];
        for (const [barcode, rows] of Object.entries(bySku)) {
          const daily = rollupDaily(rows);
          const keys = Object.keys(daily).sort();
          if (keys.length < 7) continue;
          const ys = keys.map(k => daily[k]);
          const slope = linregSlope(ys); // index(0..n-1) 대비 수량 기울기
          list.push({
            barcode,
            productName: rows[0]?.productName ?? '',
            slope: +slope.toFixed(4),
            avg: +(avg(ys) || 0).toFixed(2),
            last: ys[ys.length - 1],
          });
        }
        list.sort((a, b) => (body.action === 'trend_risers' ? b.slope - a.slope : a.slope - b.slope));
        return NextResponse.json({ action: body.action, rows: list.slice(0, topN), meta: { topN } });
      }

      case 'seasonality_weekday': {
        const byWd = groupBy(sales, r => String(new Date(r.sale_date).getDay())); // 0=일
        const rows = Object.entries(byWd).map(([wd, arr]) => ({
          weekday: wd,
          units: sumBy(arr, r => r.qty),
          revenue: sumBy(arr, r => r.revenue),
        })).sort((a, b) => Number(a.weekday) - Number(b.weekday));
        return NextResponse.json({ action: body.action, rows });
      }

      case 'seasonality_month': {
        const byM = groupBy(sales, r => String((r.sale_date as string).slice(0, 7)));
        const rows = Object.entries(byM).map(([m, arr]) => ({
          month: m,
          units: sumBy(arr, r => r.qty),
          revenue: sumBy(arr, r => r.revenue),
        })).sort((a, b) => a.month.localeCompare(b.month));
        return NextResponse.json({ action: body.action, rows });
      }

      case 'stockout_risk': {
        const days = clampInt(body.params?.adsDays, 28, 7, 90);
        const coverThreshold = clampInt(body.params?.coverDays, 7, 1, 90);
        const fromAds = addDays(to, -days + 1);
        const salesAds = sales.filter(r => r.sale_date >= fromAds.toISOString().slice(0,10) && r.sale_date <= to.toISOString().slice(0,10));
        const bySku = groupBy(salesAds, r => String(r.barcode));
        const itemMap = new Map(items.map(i => [String(i.barcode), i]));

        const rows: any[] = [];
        for (const [barcode, arr] of Object.entries(bySku)) {
          const i = itemMap.get(barcode);
          if (!i) continue;
          const units = sumBy(arr, r => r.qty);
          const ads = units / days; // 평균 일판매
          if (ads <= 0) continue;
          const cover = i.qty / ads;
          if (cover <= coverThreshold) {
            rows.push({
              barcode,
              productName: i.productName,
              stock_qty: i.qty,
              ads: +ads.toFixed(2),
              cover_days: +cover.toFixed(1),
            });
          }
        }
        rows.sort((a, b) => a.cover_days - b.cover_days);
        return NextResponse.json({ action: body.action, rows, meta: { adsDays: days, coverThreshold } });
      }

      case 'slow_movers': {
        const minStock = clampInt(body.params?.minStock, 1, 0, 1_000_000);
        const staleDays = clampInt(body.params?.staleDays, 30, 7, 365);
        const cutoff = addDays(to, -staleDays + 1);
        const latestBySku = lastSaleDateBySku(sales);
        const rows = items
          .filter(i => (i.qty || 0) >= minStock)
          .map(i => {
            const last = latestBySku.get(String(i.barcode));
            return {
              barcode: String(i.barcode),
              productName: i.productName,
              stock_qty: i.qty,
              last_sale_date: last ?? null,
              stale_days: last ? diffDays(to, new Date(last)) : null,
            };
          })
          .filter(r => !r.last_sale_date || new Date(r.last_sale_date) < cutoff)
          .sort((a, b) => (b.stock_qty || 0) - (a.stock_qty || 0))
          .slice(0, 500);
        return NextResponse.json({ action: body.action, rows, meta: { minStock, staleDays } });
      }

      case 'abc_class': {
        const bySku = groupBy(sales, r => String(r.barcode));
        const list = Object.entries(bySku).map(([barcode, arr]) => ({
          barcode,
          productName: arr[0]?.productName ?? '',
          revenue: sumBy(arr, r => r.revenue),
          units: sumBy(arr, r => r.qty),
        })).sort((a, b) => b.revenue - a.revenue);
        const total = sumBy(list, r => r.revenue) || 1;
        let cum = 0;
        for (const r of list) {
          cum += r.revenue;
          const share = cum / total;
          (r as any).share = +(share * 100).toFixed(2);
          (r as any).class = share <= 0.8 ? 'A' : share <= 0.95 ? 'B' : 'C';
        }
        return NextResponse.json({ action: body.action, rows: list.slice(0, 500), meta: { total } });
      }

      case 'price_outliers': {
        const bySku = groupBy(sales, r => String(r.barcode));
        const out: any[] = [];
        for (const [barcode, arr] of Object.entries(bySku)) {
          const prices = arr.map(r => Number(r.unit_price || 0)).filter(Boolean);
          if (prices.length < 10) continue;
          const med = median(prices);
          const mad = median(prices.map(p => Math.abs(p - med))) || 1;
          for (const r of arr) {
            const z = 0.6745 * (Number(r.unit_price) - med) / mad;
            if (Math.abs(z) >= 3.5) {
              out.push({
                barcode,
                productName: r.productName,
                sale_date: r.sale_date,
                unit_price: r.unit_price,
                robust_z: +z.toFixed(2),
              });
            }
          }
        }
        out.sort((a, b) => Math.abs(b.robust_z) - Math.abs(a.robust_z));
        return NextResponse.json({ action: body.action, rows: out.slice(0, 500) });
      }

      case 'channel_mix': {
        const byC = groupBy(sales, r => String(r.channel || 'unknown'));
        const rows = Object.entries(byC).map(([ch, arr]) => ({
          channel: ch,
          units: sumBy(arr, r => r.qty),
          revenue: sumBy(arr, r => r.revenue),
          aov: Math.round((sumBy(arr, r => r.revenue) || 0) / (arr.length || 1)),
        })).sort((a, b) => b.revenue - a.revenue);
        return NextResponse.json({ action: body.action, rows });
      }

      default:
        return NextResponse.json({ error: 'UNKNOWN_ACTION' }, { status: 400 });
    }
  } catch (e: any) {
    console.error('Insights API error:', e);
    return NextResponse.json({ error: e?.message ?? 'INTERNAL' }, { status: 500 });
  }
}

/** ===== Helpers & Types ===== */
type Item = { barcode: number | string; productName?: string; qty: number; tenant_id: string; };
type Sale = {
  sale_date: string; barcode: number | string; productName?: string;
  qty: number; unit_price: number; revenue: number; channel?: string;
  tenant_id: string;
};

function ensureRange(p: any = {}) {
  const today = new Date(); 
  const to = new Date(p.to ?? today.toISOString().slice(0, 10));
  const from = new Date(p.from ?? addDays(to, -29)); // default 30일
  return { from, to };
}

async function fetchItems(supabase: any, tenantId: string) {
  const { data, error } = await supabase.from('items')
    .select('barcode, productname, qty, tenant_id')
    .eq('tenant_id', tenantId)
    .limit(100000);
  if (error) throw error;
  return data as Item[];
}

async function fetchSales(supabase: any, tenantId: string, from: Date, to: Date) {
  const { data, error } = await supabase.from('sales')
    .select('sale_date, barcode, productname, qty, unit_price, revenue, channel, tenant_id')
    .eq('tenant_id', tenantId)
    .gte('sale_date', from.toISOString().slice(0,10))
    .lte('sale_date', to.toISOString().slice(0,10))
    .limit(100000); // dev 기준
  if (error) throw error;
  // 판매행만 필터링 (qty > 0 && channel != snapshot)
  return (data ?? [])
    .filter((r: any) => (r.qty || 0) > 0 && r.channel !== 'snapshot')
    .map(normalizeSale) as Sale[];
}

function normalizeSale(r: any): Sale {
  return {
    sale_date: String(r.sale_date),
    barcode: String(r.barcode),
    productName: r.productname ?? '',
    qty: Number(r.qty) || 0,
    unit_price: Number(r.unit_price) || 0,
    revenue: Number(r.revenue) || (Number(r.qty) || 0) * (Number(r.unit_price) || 0),
    channel: r.channel ?? 'unknown',
    tenant_id: r.tenant_id,
  };
}

function groupBy<T>(arr: T[], keyFn: (x: T) => string) {
  const m: Record<string, T[]> = {}; 
  for (const it of arr) (m[keyFn(it)] ||= []).push(it); 
  return m;
}

function sumBy<T>(arr: T[], fn: (x: T) => number) { 
  return arr.reduce((s, x) => s + (fn(x) || 0), 0); 
}

function avg(ns: number[]) { 
  return ns.length ? ns.reduce((a,b)=>a+b,0)/ns.length : 0; 
}

function linregSlope(ys: number[]) { // x=0..n-1
  const n = ys.length; 
  const sx = (n-1)*n/2; 
  const sxx = (n-1)*n*(2*n-1)/6;
  const sy = ys.reduce((a,b)=>a+b,0);
  let sxy = 0; 
  for (let i=0;i<n;i++) sxy += i*ys[i];
  const denom = n*sxx - sx*sx; 
  if (!denom) return 0;
  return (n*sxy - sx*sy) / denom;
}

function rollupDaily(rows: Sale[]) {
  const m: Record<string, number> = {};
  for (const r of rows) m[r.sale_date] = (m[r.sale_date] ?? 0) + (r.qty || 0);
  return m;
}

function lastSaleDateBySku(rows: Sale[]) {
  const m = new Map<string,string>();
  for (const r of rows) {
    const k = String(r.barcode);
    const d = r.sale_date;
    if (!m.has(k) || m.get(k)! < d) m.set(k, d);
  }
  return m;
}

function diffDays(a: Date, b: Date) { 
  return Math.floor((a.getTime()-b.getTime())/86400000); 
}

function addDays(d: Date, n: number) { 
  const x=new Date(d); 
  x.setDate(x.getDate()+n); 
  return x; 
}

function clampInt(v: any, def:number, min:number, max:number) { 
  v=Number(v); 
  if(Number.isFinite(v)) return Math.min(max, Math.max(min, Math.trunc(v))); 
  return def; 
}

function num(v:any, def:number){ 
  const n=Number(v); 
  return Number.isFinite(n)?n:def; 
}

function fmtKRW(n:number){ 
  return `${Math.round(n).toLocaleString()}원`; 
}

function fmt(n:number){ 
  return `${Math.round(n).toLocaleString()}`; 
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 
    ? (sorted[mid - 1] + sorted[mid]) / 2 
    : sorted[mid];
}
