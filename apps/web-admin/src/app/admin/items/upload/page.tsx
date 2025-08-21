'use client';

import { useEffect, useMemo, useState } from 'react';

export default function UploadItemsPage() {
  const defaultTenant = useMemo(() => process.env.NEXT_PUBLIC_TENANT_ID || '', []);
  const [file, setFile] = useState<File | null>(null);
  const [tenantId, setTenantId] = useState<string>(defaultTenant);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (!file) throw new Error('file required');
      if (!tenantId) throw new Error('tenant_id required');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('tenant_id', tenantId);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'upload failed');
      setResult(json);
      setToast('업로드 성공');
    } catch (e: any) {
      setError(e?.message || 'failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 py-2 rounded shadow">
          {toast}
        </div>
      )}
      <h1 className="text-2xl font-semibold">CSV 업로드 (Items)</h1>
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">파일</label>
          <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">tenant_id</label>
          <input
            className="border rounded px-3 py-2 w-full"
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            placeholder="tenant uuid"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={onSubmit}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? '업로드 중...' : '업로드'}
          </button>
          <a href="/admin/items" className="px-4 py-2 border rounded">목록 보기</a>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>
      )}
      {result && (
        <div className="border rounded p-4">
          <div className="font-medium mb-2">응답</div>
          <pre className="text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          <div className="mt-3 flex gap-2">
            <a href="/admin/items" className="px-3 py-2 bg-green-600 text-white rounded">목록으로</a>
            <button onClick={() => setResult(null)} className="px-3 py-2 border rounded">닫기</button>
          </div>
        </div>
      )}
    </div>
  );
}


