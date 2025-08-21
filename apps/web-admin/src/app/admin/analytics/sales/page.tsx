'use client';

import { useEffect, useMemo, useState } from 'react';
import { fmtKRW, fmtInt, toCSV } from '@/lib/format';

export default function SalesAnalyticsPage() {
  const defaultTenant = useMemo(() => process.env.NEXT_PUBLIC_TENANT_ID || '', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [days, setDays] = useState(7);
  const [rows, setRows] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [skuFilter, setSkuFilter] = useState('');
  const [monthsLimit, setMonthsLimit] = useState(6);

  const load = async () => {
    const params = new URLSearchParams();
    if (tenantId) params.set('tenant_id', tenantId);
    params.set('recent', '1');
    const res = await fetch(`/api/analytics/sales?${params.toString()}`, { cache: 'no-store' });
    const json = await res.json();
    setRows(json.rows || []);
    setRecent(json.recent || []);
    setLastRefreshed(new Date().toLocaleTimeString());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onGenerate = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/analytics/mock-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenant_id: tenantId, days }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMsg(JSON.stringify(json, null, 2));
        return;
      }
      setMsg(JSON.stringify(json, null, 2));
      await load();
    } catch (e: any) {
      setMsg(e?.message || 'failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Sales Analytics (Mock)</h1>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">tenant_id</label>
          <input className="border rounded px-3 py-2 w-[420px]" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">days</label>
          <input type="number" className="border rounded px-3 py-2 w-28" value={days} onChange={e=>setDays(Number(e.target.value)||0)} />
        </div>
        <button onClick={async()=>{await onGenerate(); await load();}} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading?'생성 중...':'목업 생성(자동 새로고침)'}</button>
        <button onClick={load} className="px-3 py-2 border rounded">요약 새로고침</button>
        {lastRefreshed && <span className="text-sm text-gray-500">마지막 갱신 {lastRefreshed} · {rows.length} rows</span>}
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm mb-1">SKU 필터(부분일치)</label>
          <input className="border rounded px-3 py-2 w-60" value={skuFilter} onChange={e=>setSkuFilter(e.target.value)} placeholder="예: SKU-1001" />
        </div>
        <div>
          <label className="block text-sm mb-1">표시 개월수</label>
          <select className="border rounded px-3 py-2" value={monthsLimit} onChange={e=>setMonthsLimit(Number(e.target.value))}>
            <option value={3}>3</option>
            <option value={6}>6</option>
            <option value={12}>12</option>
          </select>
        </div>
      </div>

      {msg && <div className="bg-gray-50 border rounded px-3 py-2">{msg}</div>}

      {/* 월별 매출 차트 (집계 rows 기반) */}
      {(() => {
        // 필터 적용
        const fr = rows.filter(r => !skuFilter || String(r.sku || '').includes(skuFilter));
        // month 라벨 만들기, 매출 합계(모든 SKU 합)
        const m2rev = new Map<string, number>();
        for (const r of fr) {
          const d = new Date(r.month);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
          m2rev.set(key, (m2rev.get(key) || 0) + Number(r.revenue || 0));
        }
        const labels = Array.from(m2rev.keys()).sort();
        const sliced = labels.slice(Math.max(0, labels.length - monthsLimit));
        const data = sliced.map(k => m2rev.get(k) || 0);
        const max = Math.max(1, ...data);
        const W = 800, H = 200, pad = 24;
        const bw = Math.max(10, Math.floor((W - pad*2) / Math.max(1, data.length)) - 6);
        return (
          <div className="border rounded p-4">
            <div className="font-medium mb-2">월별 매출 차트(합계)</div>
            <svg width={W} height={H} className="max-w-full">
              {data.map((v, i) => {
                const x = pad + i * (bw + 6);
                const h = Math.max(1, Math.round((v / max) * (H - pad*2)));
                const y = H - pad - h;
                return (
                  <g key={i}>
                    <rect x={x} y={y} width={bw} height={h} fill="#3b82f6" />
                    <text x={x + bw/2} y={H - 6} textAnchor="middle" fontSize="10">{sliced[i]}</text>
                  </g>
                );
              })}
            </svg>
          </div>
        );
      })()}

      {/* Top 5 SKUs (latest month) */}
      {(() => {
        if (!rows.length) return null;
        const months = rows.map(r => r.month).sort();
        const latest = months[months.length - 1];
        const bySku = new Map<string, number>();
        for (const r of rows) {
          if (r.month === latest) {
            bySku.set(r.sku, (bySku.get(r.sku) || 0) + Number(r.revenue || 0));
          }
        }
        const top = Array.from(bySku.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5);
        return (
          <div className="border rounded p-4">
            <div className="font-medium mb-2">Top 5 SKUs (최근월, 매출)</div>
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">sku</th>
                  <th className="text-left px-3 py-2">revenue</th>
                </tr>
              </thead>
              <tbody>
                {top.map(([sku, rev]) => (
                  <tr key={sku} className="border-t">
                    <td className="px-3 py-2">{sku}</td>
                    <td className="px-3 py-2">{rev.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">month</th>
              <th className="text-left px-3 py-2">sku</th>
              <th className="text-left px-3 py-2">total_qty</th>
              <th className="text-left px-3 py-2">revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.month}</td>
                <td className="px-3 py-2">{r.sku}</td>
                <td className="px-3 py-2">{r.total_qty}</td>
                <td className="px-3 py-2">{r.revenue}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No data</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">sold_at</th>
              <th className="text-left px-3 py-2">sku</th>
              <th className="text-left px-3 py-2">qty</th>
              <th className="text-left px-3 py-2">price</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2">{r.sold_at}</td>
                <td className="px-3 py-2">{r.sku}</td>
                <td className="px-3 py-2">{r.qty}</td>
                <td className="px-3 py-2">{r.price}</td>
              </tr>
            ))}
            {!recent.length && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">No recent rows</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


