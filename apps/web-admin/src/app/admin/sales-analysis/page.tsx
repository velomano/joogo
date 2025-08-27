'use client';

import { useState, useEffect } from 'react';

interface SalesSummary {
  summary: {
    total_items: number;
    total_quantity: number;
    average_quantity: number;
    low_stock_count: number;
    out_of_stock_count: number;
    sufficient_stock_count: number;
  };
  top_stock_items: Array<{
    barcode: number;
    product_name: string;
    qty: number;
    updated_at: string;
  }>;
  low_stock_items: Array<{
    barcode: number;
    product_name: string;
    qty: number;
    status: string;
    updated_at: string;
  }>;
  all_items: Array<{
    barcode: number;
    product_name: string;
    qty: number;
    status: string;
    updated_at: string;
  }>;
  tenant_id: string;
  retrieved_at: string;
  note: string;
}

export default function SalesAnalysisPage() {
  const [data, setData] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId] = useState("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/sales-summary?tenant_id=${tenantId}`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to load sales summary');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-8">데이터를 불러오는 중...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-8">데이터를 불러올 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">재고 분석 (실시간 데이터)</h1>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          데이터 새로고침
        </button>
      </div>

      {/* 테넌트 정보 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-sm text-gray-600">
          <strong>테넌트 ID</strong> ✓ 자동 설정됨<br />
          <span className="font-mono">{tenantId}</span><br />
          <span className="text-green-600">개발용 테넌트 ID가 자동으로 설정되었습니다</span>
        </div>
      </div>

      {/* 마지막 갱신 정보 */}
      <div className="text-sm text-gray-500 mb-6">
        마지막 갱신 {new Date(data.retrieved_at).toLocaleTimeString('ko-KR')} · {data.summary.total_items}개 상품
      </div>

      {/* 요약 통계 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{data.summary.total_items.toLocaleString()}</div>
          <div className="text-sm text-blue-600">총 상품 수</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{data.summary.total_quantity.toLocaleString()}</div>
          <div className="text-sm text-green-600">총 재고 수량</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{data.summary.average_quantity}</div>
          <div className="text-sm text-orange-600">평균 수량</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{data.summary.low_stock_count}</div>
          <div className="text-sm text-red-600">부족 재고</div>
          <div className="text-xs text-red-500">10개 미만</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{data.summary.out_of_stock_count}</div>
          <div className="text-sm text-orange-600">품절 상품</div>
          <div className="text-xs text-orange-500">0개</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{data.summary.sufficient_stock_count}</div>
          <div className="text-sm text-green-600">충분 재고</div>
          <div className="text-xs text-green-500">50개 이상</div>
        </div>
      </div>

      {/* Top 10 재고 상품 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">상위 재고 상품 (Top 10)</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">순위</th>
                <th className="text-left p-3">바코드</th>
                <th className="text-left p-3">상품명</th>
                <th className="text-right p-3">현재 수량</th>
                <th className="text-left p-3">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {data.top_stock_items.map((item, index) => (
                <tr key={item.barcode} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-semibold">{index + 1}</td>
                  <td className="p-3 font-mono">{item.barcode}</td>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3 text-right font-semibold">{item.qty}개</td>
                  <td className="p-3 text-sm text-gray-600">{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부족 재고 상품 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">⚠️ 부족 재고 상품 (10개 미만)</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">바코드</th>
                <th className="text-left p-3">상품명</th>
                <th className="text-right p-3">현재 수량</th>
                <th className="text-center p-3">상태</th>
                <th className="text-left p-3">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {data.low_stock_items.map((item) => (
                <tr key={item.barcode} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">{item.barcode}</td>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3 text-right font-semibold">{item.qty}개</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === '품절' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 전체 상품 목록 */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">전체 상품 목록</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">바코드</th>
                <th className="text-left p-3">상품명</th>
                <th className="text-right p-3">현재 수량</th>
                <th className="text-center p-3">상태</th>
                <th className="text-left p-3">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {data.all_items.map((item) => (
                <tr key={item.barcode} className="border-t hover:bg-gray-50">
                  <td className="p-3 font-mono">{item.barcode}</td>
                  <td className="p-3">{item.product_name}</td>
                  <td className="p-3 text-right font-semibold">{item.qty}개</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === '품절' ? 'bg-red-100 text-red-800' : 
                      item.status === '부족' ? 'bg-orange-100 text-orange-800' : 
                      item.status === '충분' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 데이터 요약 */}
      <div className="text-sm text-gray-600 text-center">
        {data.note}
      </div>
    </div>
  );
}
