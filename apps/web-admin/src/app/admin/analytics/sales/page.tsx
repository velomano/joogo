'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

export default function SalesAnalyticsPage() {
  // 개발용 고정 테넌트 ID - 자동으로 설정
  const defaultTenant = useMemo(() => '84949b3c-2cb7-4c42-b9f9-d1f37d371e00', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [items, setItems] = useState<any[]>([]);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) {
      setMsg('테넌트 ID가 필요합니다.');
      return;
    }
    
    setLoading(true);
    try {
      // 실제 core.items 데이터 조회
      const res = await fetch(`/api/items?tenant_id=${tenantId}`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      setItems(json.items || []);
      setLastRefreshed(new Date().toLocaleTimeString());
      setMsg(null); // 성공 시 에러 메시지 제거
    } catch (e: any) {
      setMsg(`데이터 로드 실패: ${e?.message || '알 수 없는 오류'}`);
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // 페이지 마운트 시에만 한 번 실행
  useEffect(() => {
    if (tenantId) {
      load();
    }
  }, []); // 빈 의존성 배열로 변경

  // 페이지 포커스 시 자동 데이터 새로고침 (페이지 이동 후 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      if (tenantId && items.length === 0) {
        load();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tenantId, items.length, load]);

  // 재고 통계 계산
  const stats = useMemo(() => {
    if (!items.length) return {
      totalProducts: 0,
      totalQuantity: 0,
      averageQuantity: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      highStockCount: 0
    };

    const totalProducts = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const averageQuantity = totalProducts > 0 ? totalQuantity / totalProducts : 0;
    
    const lowStockCount = items.filter(item => Number(item.qty || 0) < 10).length;
    const outOfStockCount = items.filter(item => Number(item.qty || 0) === 0).length;
    const highStockCount = items.filter(item => Number(item.qty || 0) >= 50).length;

    return {
      totalProducts,
      totalQuantity,
      averageQuantity,
      lowStockCount,
      outOfStockCount,
      highStockCount
    };
  }, [items]);

  // 상위 재고 상품 (수량 기준)
  const topStockItems = useMemo(() => {
    return [...items]
      .sort((a, b) => Number(b.qty || 0) - Number(a.qty || 0))
      .slice(0, 10);
  }, [items]);

  // 부족 재고 상품
  const lowStockItems = useMemo(() => {
    return items
      .filter(item => Number(item.qty || 0) < 10)
      .sort((a, b) => Number(a.qty || 0) - Number(b.qty || 0))
      .slice(0, 10);
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">재고 분석 (실시간 데이터)</h1>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">테넌트 ID <span className="text-green-500">✓ 자동 설정됨</span></label>
          <input 
            className="border rounded px-3 py-2 w-[420px] bg-gray-50 text-gray-600" 
            value={tenantId} 
            onChange={e => setTenantId(e.target.value)}
            placeholder="테넌트 ID가 자동으로 설정되었습니다"
            readOnly
          />
          <p className="text-xs text-green-600 mt-1">개발용 테넌트 ID가 자동으로 설정되었습니다</p>
        </div>
        <button 
          onClick={load} 
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? '로딩 중...' : '데이터 새로고침'}
        </button>
        {lastRefreshed && <span className="text-sm text-gray-500">마지막 갱신 {lastRefreshed} · {items.length}개 상품</span>}
      </div>

      {msg && <div className="bg-gray-50 border rounded px-3 py-2">{msg}</div>}

      {/* 새 대시보드 - 상단 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <div className="text-blue-100 text-sm">총 상품 수</div>
          <div className="text-2xl font-bold mt-1">
            {stats.totalProducts.toLocaleString()}개
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <div className="text-green-100 text-sm">총 재고 수량</div>
          <div className="text-2xl font-bold mt-1">
            {stats.totalQuantity.toLocaleString()}개
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
          <div className="text-purple-100 text-sm">평균 수량</div>
          <div className="text-2xl font-bold mt-1">
            {Math.round(stats.averageQuantity)}개
          </div>
        </div>
      </div>

      {/* 추가 통계 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <div className="text-yellow-800 text-sm font-medium">부족 재고</div>
          <div className="text-yellow-900 text-2xl font-bold mt-1">
            {stats.lowStockCount}개
          </div>
          <div className="text-yellow-600 text-sm mt-1">10개 미만</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="text-red-800 text-sm font-medium">품절 상품</div>
          <div className="text-red-900 text-2xl font-bold mt-1">
            {stats.outOfStockCount}개
          </div>
          <div className="text-red-600 text-sm mt-1">0개</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-lg">
          <div className="text-indigo-800 text-sm font-medium">충분 재고</div>
          <div className="text-indigo-900 text-2xl font-bold mt-1">
            {stats.highStockCount}개
          </div>
          <div className="text-indigo-600 text-sm mt-1">50개 이상</div>
        </div>
      </div>

      {/* 상위 재고 상품 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">상위 재고 상품 (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">순위</th>
                <th className="text-left px-4 py-2">바코드</th>
                <th className="text-left px-4 py-2">상품명</th>
                <th className="text-left px-4 py-2">현재 수량</th>
                <th className="text-left px-4 py-2">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {topStockItems.map((item, idx) => (
                <tr key={item.barcode} className="border-b">
                  <td className="px-4 py-2 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium">{item.barcode}</td>
                  <td className="px-4 py-2">{item.product_name}</td>
                  <td className="px-4 py-2 font-bold text-green-600">{item.qty.toLocaleString()}개</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부족 재고 상품 */}
      {lowStockItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">⚠️ 부족 재고 상품 (10개 미만)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="text-left px-4 py-2">바코드</th>
                  <th className="text-left px-4 py-2">상품명</th>
                  <th className="text-left px-4 py-2">현재 수량</th>
                  <th className="text-left px-4 py-2">상태</th>
                  <th className="text-left px-4 py-2">업데이트</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.barcode} className="border-b">
                    <td className="px-4 py-2 font-medium">{item.barcode}</td>
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2 font-bold text-yellow-600">{item.qty}개</td>
                    <td className="px-4 py-2">
                      {item.qty === 0 ? (
                        <span className="text-red-600 font-medium">품절</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">부족</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 전체 상품 목록 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">전체 상품 목록</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">바코드</th>
                <th className="text-left px-4 py-2">상품명</th>
                <th className="text-left px-4 py-2">현재 수량</th>
                <th className="text-left px-4 py-2">상태</th>
                <th className="text-left px-4 py-2">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.barcode} className="border-b">
                  <td className="px-4 py-2 font-medium">{item.barcode}</td>
                  <td className="px-4 py-2">{item.product_name}</td>
                  <td className="px-4 py-2 font-bold">{item.qty.toLocaleString()}개</td>
                  <td className="px-4 py-2">
                    {item.qty === 0 ? (
                      <span className="text-red-600 font-medium">품절</span>
                    ) : item.qty < 10 ? (
                      <span className="text-yellow-600 font-medium">부족</span>
                    ) : (
                      <span className="text-green-600 font-medium">충분</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


