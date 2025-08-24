'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// fetchItems 함수 정의
async function fetchItems(tenantId: string) {
  const res = await fetch(`/api/items?tenant_id=${tenantId}`);
  if (!res.ok) throw new Error('Failed to fetch items');
  return res.json();
}

export default function ItemsPage({ searchParams }: { searchParams?: { tenant_id?: string } }) {
  const [showDetailed, setShowDetailed] = useState(false);
  
  // 개발용 고정 테넌트 ID
  const tenantId = searchParams?.tenant_id || '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchItems(tenantId).then(setData).finally(() => setLoading(false));
  }, [tenantId]);

  if (loading) return <div className="text-center py-8">로딩 중...</div>;
  if (!data) return <div className="text-center py-8">데이터를 불러올 수 없습니다.</div>;

  // 요약 통계 계산
  const totalItems = data.items?.length || 0;
  const totalQuantity = data.items?.reduce((sum: number, item: any) => sum + (item.qty || 0), 0) || 0;
  const lowStockItems = data.items?.filter((item: any) => (item.qty || 0) < 10).length || 0;
  const outOfStockItems = data.items?.filter((item: any) => (item.qty || 0) === 0).length || 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">📋 재고 목록</h1>
        <div className="flex gap-2">
          <Link href="/admin/items/upload" className="px-3 py-2 border rounded">🚀 통합 업로드</Link>
        </div>
      </div>

      {/* 요약 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
          <div className="text-sm text-blue-600">총 상품 수</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{totalQuantity.toLocaleString()}</div>
          <div className="text-sm text-green-600">총 재고 수량</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{lowStockItems}</div>
          <div className="text-sm text-orange-600">부족 재고</div>
          <div className="text-xs text-orange-500">(10개 미만)</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{outOfStockItems}</div>
          <div className="text-sm text-red-600">품절 상품</div>
          <div className="text-xs text-red-500">(0개)</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <form action="/admin/items" method="get" className="flex gap-2">
          <input name="tenant_id" defaultValue={tenantId} className="border rounded px-3 py-2 w-[420px]" placeholder="tenant uuid" />
          <button className="px-3 py-2 bg-gray-800 text-white rounded">조회</button>
        </form>
        
        <button
          onClick={() => setShowDetailed(!showDetailed)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          {showDetailed ? '📋 간단 보기' : '🔍 상세 보기'}
        </button>
      </div>

      {/* 테이블 컨테이너 - 가로 스크롤 지원 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {/* 기본 보기 컬럼 */}
                <th className="text-left px-3 py-2 whitespace-nowrap">📱 바코드</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">📦 재고수량</th>
                <th className="text-left px-3 py-2 whitespace-nowrap">🕒 최종업데이트</th>
                
                {/* 상세 보기 추가 컬럼들 */}
                {showDetailed && (
                  <>
                    <th className="text-left px-3 py-2 whitespace-nowrap">🏷️ 상품명</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">🔤 옵션명</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">💰 단가</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">🛍️ 판매처</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">📅 생성일</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">🏢 테넌트 ID</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">📊 총 재고</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">💵 매출</th>
                    <th className="text-left px-3 py-2 whitespace-nowrap">📈 판매량</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.items?.map((r: any, i: number) => {
                const qty = r.qty || 0;
                let qtyColor = 'text-gray-900';
                if (qty === 0) qtyColor = 'text-red-600 font-bold';
                else if (qty < 10) qtyColor = 'text-orange-600 font-semibold';
                
                return (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    {/* 기본 보기 컬럼 */}
                    <td className="px-3 py-2 whitespace-nowrap font-mono text-xs">{r.barcode}</td>
                    <td className={`px-3 py-2 whitespace-nowrap ${qtyColor}`}>{qty.toLocaleString()}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                      {r.updated_at ? new Date(r.updated_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    
                    {/* 상세 보기 추가 컬럼들 */}
                    {showDetailed && (
                      <>
                        <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={r.product_name || r.productname || '-'}>
                          {r.product_name || r.productname || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap max-w-xs truncate" title={r.option_name || '-'}>
                          {r.option_name || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.unit_price_krw ? `${r.unit_price_krw.toLocaleString()}원` : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.channel || '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-mono text-gray-500">
                          {r.tenant_id ? r.tenant_id.substring(0, 8) + '...' : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.qty ? r.qty.toLocaleString() : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.revenue_krw ? `${r.revenue_krw.toLocaleString()}원` : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {r.sale_qty ? r.sale_qty.toLocaleString() : '-'}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 보기 안내 메시지 */}
      {showDetailed && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">💡</span>
            <span className="text-sm text-blue-800">
              <strong>상세 보기 모드</strong> - 모든 컬럼을 확인할 수 있습니다. 
              테이블이 가로로 길어질 수 있으니 가로 스크롤을 사용해주세요.
            </span>
          </div>
        </div>
      )}

      {/* 데이터 요약 */}
      <div className="text-sm text-gray-600 text-center">
        총 {totalItems}개 상품 • {totalQuantity.toLocaleString()}개 재고
      </div>
    </div>
  );
}
