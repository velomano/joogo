'use client';

import { useEffect, useMemo, useState } from "react";

type Item = {
  tenant_id: string;
  barcode: number;
  product_name: string | null;
  option_name: string | null;
  qty: number;
  created_at: string;
  updated_at: string;
};

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [tenantId] = useState("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  const fetchPage = async (pageNum: number, search?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tenant_id: tenantId,
        page: String(pageNum),
        limit: String(limit),
      });
      if (search && search.trim()) params.set("q", search.trim());

      const res = await fetch(`/api/items?${params.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fetch failed");

      setItems(json.items || []);
      setTotal(json.total_count || 0);
      setPage(json.page || pageNum);
    } catch (e) {
      console.error(e);
      alert("목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(1, q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, tenantId]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPage(1, q);
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">재고 목록</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="바코드/상품명 검색"
          className="border rounded px-3 py-2 w-64"
        />
        <button className="rounded px-4 py-2 border" type="submit" disabled={loading}>
          검색
        </button>
        <label className="ml-auto text-sm flex items-center gap-2">
          페이지당
          <select
            className="border rounded px-2 py-1"
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
            <option value={500}>500</option>
          </select>
          개
        </label>
      </form>

      <div className="text-sm mb-2">
        총 {total.toLocaleString()}개 중 {items.length.toLocaleString()}개 표시 (페이지 {page}/{totalPages})
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">바코드</th>
              <th className="text-left p-2">상품명</th>
              <th className="text-left p-2">옵션</th>
              <th className="text-right p-2">재고수량</th>
              <th className="text-left p-2">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.tenant_id}-${item.barcode}`} className="border-t hover:bg-gray-50">
                <td className="p-2 font-mono">{item.barcode}</td>
                <td className="p-2">{item.product_name || "-"}</td>
                <td className="p-2">{item.option_name || "-"}</td>
                <td className="p-2 text-right">
                  <span className={`font-semibold ${item.qty < 10 ? 'text-red-600' : item.qty < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {item.qty.toLocaleString()}
                  </span>
                </td>
                <td className="p-2 text-sm text-gray-600">
                  {new Date(item.updated_at).toLocaleDateString('ko-KR')}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td className="p-4 text-center" colSpan={5}>데이터가 없습니다.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-4">
        <button
          className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || page <= 1}
          onClick={() => fetchPage(page - 1, q)}
        >
          이전
        </button>
        <span className="text-sm">
          {page} / {totalPages}
        </span>
        <button
          className="border rounded px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading || page >= totalPages}
          onClick={() => fetchPage(page + 1, q)}
        >
          다음
        </button>
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-500">
          데이터를 불러오는 중...
        </div>
      )}

      {/* 하단 정보 표시 */}
      {!loading && items.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">재고 현황 요약</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{total.toLocaleString()}</div>
              <div className="text-sm text-gray-600">전체 상품</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {items.filter(item => item.qty >= 50).length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">충분한 재고</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {items.filter(item => item.qty > 0 && item.qty < 10).length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">부족한 재고</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {items.filter(item => item.qty === 0).length.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">품절</div>
            </div>
          </div>
          
          {q && (
            <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
              <div className="text-sm text-blue-800">
                <strong>검색 결과:</strong> "{q}"에 대한 검색 결과 {items.length}개를 찾았습니다.
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
