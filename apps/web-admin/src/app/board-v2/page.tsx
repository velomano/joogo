'use client';
import BoardLayout from './_components/BoardLayout';
import { useFilters } from '../../lib/state/filters';
import { FEATURE_FLAGS } from '../../lib/featureFlags';
import { Adapters } from './_data/adapters';
import { useEffect, useState } from 'react';
import CalendarHeatmap from './_components/CalendarHeatmap';
import ChannelRegionSmallMultiples from './_components/ChannelRegionSmallMultiples';
import TreemapPareto from './_components/TreemapPareto';
import FunnelDual from './_components/FunnelDual';

type KPI = { label: string; value: string };

function KpiBar() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const { from, to } = useFilters();
  useEffect(() => {
    (async () => {
      const data = await Adapters.calendarHeatmap({ from, to }, {});
      const sum = data.reduce((a, b) => a + b.revenue, 0);
      const orders = Math.round(sum / 2000000);
      const roas = (data.reduce((a,b)=>a+(b.roas ?? 0),0) / (data.length||1)).toFixed(2);
      setKpis([
        { label: '총 매출', value: `₩${sum.toLocaleString()}` },
        { label: '총 주문수', value: `${orders.toLocaleString()}건` },
        { label: '평균 ROAS', value: `${roas}` },
      ]);
    })();
  }, [from, to]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {kpis.map((k) => (
        <div key={k.label} className="rounded-2xl bg-slate-800/60 p-4 border border-slate-700">
          <div className="text-sm text-slate-400">{k.label}</div>
          <div className="text-2xl font-semibold mt-1">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

export default function Page() {
  const { from, to } = useFilters();
  return (
    <BoardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">판매 보드 v2 — 3-Layer</h1>
        <div className="text-xs text-slate-400">
          Flags: {FEATURE_FLAGS.CUPED ? 'CUPED' : '—'}, {FEATURE_FLAGS.COMPARE_PIN ? 'COMPARE' : '—'}
        </div>
      </div>
      <KpiBar />
      <div className="grid grid-cols-1 gap-6 mt-6">
        <CalendarHeatmap from={from} to={to} />
        <ChannelRegionSmallMultiples from={from} to={to} />
        <TreemapPareto from={from} to={to} />
        <FunnelDual from={from} to={to} />
      </div>
    </BoardLayout>
  );
}
