'use client';

import { useEffect, useMemo, useState } from "react";

type Item = {
  tenant_id: string;
  barcode: number;
  productname: string | null;
  product_name: string | null;
  option_name: string | null;
  qty: number;
  created_at: string;
  updated_at: string;
  sale_date: string | null;
  sale_qty: number | null;
  unit_price_krw: number | null;
  revenue_krw: number | null;
  channel: string | null;
  original_data: {
    memo?: string;
    category?: string;
    location?: string;
    cost_price?: number;
    daily_data?: Record<string, number>;
  } | null;
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

  const getRecentSaleDate = (originalData: any) => {
    if (!originalData?.daily_data) return null;
    
    const dailyData = originalData.daily_data;
    const dates = Object.keys(dailyData).filter(date => dailyData[date] > 0);
    
    if (dates.length === 0) return null;
    
    // 가장 최근 판매일 반환 (YYYYMMDD 형식을 YYYY.MM.DD로 변환)
    const latestDate = dates.sort().pop();
    if (!latestDate) return null;
    
    return `${latestDate.slice(0, 4)}.${latestDate.slice(4, 6)}.${latestDate.slice(6, 8)}`;
  };

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">재고 목록</h1>

      <form onSubmit={onSearch} className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="바코드/상품명/SKU 검색"
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
              <th className="text-left p-2">상품위치</th>
              <th className="text-right p-2">재고수량</th>
              <th className="text-left p-2">최근판매일</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.tenant_id}-${item.barcode}`} className="border-t hover:bg-gray-50">
                <td className="p-2 font-mono">{item.barcode}</td>
                <td className="p-2">{item.product_name || item.productname || "-"}</td>
                <td className="p-2">{item.option_name || "-"}</td>
                <td className="p-2">{item.original_data?.location || "-"}</td>
                <td className="p-2 text-right">
                  <span className={`font-semibold ${item.qty < 10 ? 'text-red-600' : item.qty < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    {item.qty.toLocaleString()}
                  </span>
                </td>
                <td className="p-2 text-sm text-gray-600">
                  {getRecentSaleDate(item.original_data) || "-"}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr><td className="p-4 text-center" colSpan={6}>데이터가 없습니다.</td></tr>
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
    </main>
  );
}
