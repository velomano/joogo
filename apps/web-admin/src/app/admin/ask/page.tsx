'use client';

import { useMemo, useState } from 'react';

export default function AskPage() {
  const defaultTenant = useMemo(() => process.env.NEXT_PUBLIC_TENANT_ID || '', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [q, setQ] = useState('최근 30일 top 5 sku');
  const [res, setRes] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const onAsk = async () => {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, tenant_id: tenantId }),
      });
      const j = await r.json();
      setRes(j);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">자연어 질의(데모)</h1>
      <div className="space-y-3">
        <div>
          <label className="block text-sm mb-1">tenant_id</label>
          <input className="border rounded px-3 py-2 w-full" value={tenantId} onChange={e=>setTenantId(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm mb-1">질문</label>
          <input className="border rounded px-3 py-2 w-full" value={q} onChange={e=>setQ(e.target.value)} placeholder="예: 최근 30일 top 5 sku / 월별 매출 추세" />
        </div>
        <div className="flex gap-2">
          <button onClick={onAsk} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50">{loading?'질의 중...':'질의'}</button>
          <a href="/admin/analytics/sales" className="px-3 py-2 border rounded">Analytics로</a>
        </div>
      </div>

      {res && (
        <div className="border rounded p-4">
          <div className="font-medium mb-2">응답</div>
          <pre className="text-sm overflow-auto">{JSON.stringify(res, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}


