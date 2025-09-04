"use client";

import { useEffect, useState } from "react";
import ErrorBanner from "@/components/ErrorBanner";
import { ensureChart, lineConfig, barConfig } from "@/lib/charts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export default function BoardPage() {
  const [tenantId, setTenantId] = useState<string>("");
  const [from, setFrom] = useState<string>("2025-01-01");
  const [to, setTo] = useState<string>("2025-12-31");
  const [errMsg, setErrMsg] = useState("");
  const debounced = useDebouncedValue({ tenantId, from, to }, 200);

  useEffect(() => {
    if (!debounced.tenantId) return;
    const run = async () => {
      try {
        const qs = new URLSearchParams({
          from: debounced.from,
          to: debounced.to,
          tenant_id: debounced.tenantId
        });
        const res = await fetch(`/api/board/charts?${qs.toString()}`, {
          headers: { "x-tenant-id": debounced.tenantId }
        });
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "API error");

        // 1) sales by date
        const labels = json.salesDaily.map((r: any) => r.sale_date);
        const values = json.salesDaily.map((r: any) => Number(r.revenue || 0));
        ensureChart("chart-sales-by-date", lineConfig(labels, "일자별 매출", values));

        // 2) ROAS by channel
        const chLabels = json.roasByChannel.map((r: any) => r.channel);
        const chValues = json.roasByChannel.map((r: any) => Number(r.avg_roas || 0));
        ensureChart("chart-roas-by-channel", barConfig(chLabels, "채널별 ROAS(평균)", chValues));
      } catch (e: any) {
        setErrMsg(e?.message ?? "차트 로드 오류");
      }
    };
    run();
  }, [debounced]);

  return (
    <div className="p-4 space-y-4">
      <ErrorBanner message={errMsg} onClose={() => setErrMsg("")} />

      <div className="flex flex-wrap gap-2 items-end">
        <input className="border rounded px-2 py-1" placeholder="tenant_id" value={tenantId} onChange={e => setTenantId(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1" value={from} onChange={e => setFrom(e.target.value)} />
        <input type="date" className="border rounded px-2 py-1" value={to} onChange={e => setTo(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-64 rounded-xl p-3 border">
          <h3 className="text-sm mb-2">일자별 매출</h3>
          <canvas id="chart-sales-by-date" />
        </div>
        <div className="h-64 rounded-xl p-3 border">
          <h3 className="text-sm mb-2">채널별 ROAS</h3>
          <canvas id="chart-roas-by-channel" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-64 rounded-xl p-3 border opacity-70">
            <h3 className="text-sm mb-2">차트 구현 예정 #{i + 3}</h3>
            <canvas id={`chart-pending-${i}`} />
          </div>
        ))}
      </div>
    </div>
  );
}