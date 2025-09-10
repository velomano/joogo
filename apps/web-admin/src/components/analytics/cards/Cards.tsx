"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function SummaryCardGroup({ tenantId }: { tenantId: string }) {
  const params = new URLSearchParams({ tenant_id: tenantId });
  const { data } = useSWR(`/api/analytics/freshness?${params}`, fetcher);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
      <Card title="최근 24h 매출" value="—" />
      <Card title="최근 24h 광고비" value="—" />
      <Card title="최근 24h ROAS" value="—" />
      <Card title="주문 수" value="—" />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4 shadow-sm">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}
