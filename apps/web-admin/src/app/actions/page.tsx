'use client';

import { useEffect, useState } from 'react';

type Card = {
  type: 'replenishment'|'discontinue'|'event'|'weather';
  sku_id: string;
  priority: number;
  reason: string;
  expected_effect: string;
  risk?: string;
  explain?: any;
  ctas: string[];
};

export default function ActionsPage() {
  const [data, setData] = useState<{items: Card[]}|null>(null);
  const [tenant, setTenant] = useState<string>('');

  useEffect(() => {
    // 기본 tenant_id 설정
    const defaultTenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
    let t = localStorage.getItem('tenant_id') || defaultTenantId;
    
    // localStorage에 저장
    if (!localStorage.getItem('tenant_id')) {
      localStorage.setItem('tenant_id', defaultTenantId);
    }
    
    setTenant(t);
    fetch(`/api/actions/queue?tenant_id=${t}`).then(r=>r.json()).then(setData);
  }, []);

  if (!tenant) {
    return <div className="p-6">
      <h1 className="text-xl font-bold">Action Queue</h1>
      <p className="mt-2">tenant_id를 설정하는 중...</p>
    </div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Action Queue</h1>
      {!data?.items?.length && <div>추천을 계산 중이거나 데이터가 없습니다.</div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data?.items?.map((c,i)=>(
          <div key={i} className="rounded-2xl shadow p-4 border">
            <div className="text-sm opacity-70">{c.type.toUpperCase()} · priority {c.priority}</div>
            <div className="font-semibold mt-1">SKU: {c.sku_id}</div>
            <div className="mt-2">{c.reason}</div>
            <div className="mt-1 text-green-700">효과: {c.expected_effect}</div>
            {c.risk && <div className="mt-1 text-amber-700">리스크: {c.risk}</div>}
            {c.explain && (
              <details className="mt-2">
                <summary className="cursor-pointer">근거 보기</summary>
                <pre className="text-xs bg-gray-50 p-2 rounded mt-1 overflow-auto">{JSON.stringify(c.explain,null,2)}</pre>
              </details>
            )}
            <div className="mt-3 flex gap-2">
              {c.ctas.includes('simulate') && (
                <button
                  className="px-3 py-1 rounded bg-black text-white"
                  onClick={() => alert('시뮬레이터는 다음 스프린트에서 활성화됩니다.')}
                >
                  시뮬레이션
                </button>
              )}

              {c.ctas.includes('approve') && (
                <button
                  className="px-3 py-1 rounded border"
                  onClick={() => alert('승인은 다음 스프린트에서 활성화됩니다.')}
                >
                  승인
                </button>
              )}

              <button
                className="px-3 py-1 rounded border"
                onClick={() => alert('보류 처리')}
              >
                보류
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
