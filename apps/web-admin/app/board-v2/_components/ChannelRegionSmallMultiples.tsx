'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Chart } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

type Row = { date:string; channel:string; region:string; revenue:number; roas?:number };

export default function ChannelRegionSmallMultiples({ from, to }: { from: string; to: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const charts = useRef<Record<string, Chart>>({});

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows: Row[] = await Adapters.channelRegion({ from, to }, {});
      if (!mounted) return;

      const byKey = new Map<string, Row[]>();
      for (const r of rows) {
        const key = `${r.region} · ${r.channel}`;
        if (!byKey.has(key)) byKey.set(key, []);
        byKey.get(key)!.push(r);
      }

      // cleanup old
      Object.values(charts.current).forEach(c => c.destroy());
      charts.current = {};

      // render grid
      const container = containerRef.current!;
      container.innerHTML = '';
      container.style.display = 'grid';
      container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(260px, 1fr))';
      container.style.gap = '12px';

      byKey.forEach((list, key) => {
        const card = document.createElement('div');
        card.className = 'rounded-2xl bg-slate-800/40 border border-slate-700 p-3 min-h-[220px]';
        const title = document.createElement('div');
        title.className = 'text-xs text-slate-400 mb-1';
        title.textContent = key;
        const canvas = document.createElement('canvas');
        card.appendChild(title);
        card.appendChild(canvas);
        container.appendChild(card);

        const ctx = canvas.getContext('2d')!;
        const labels = list.map(r => r.date);
        const data = list.map(r => r.revenue);
        charts.current[key] = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{ label: '매출', data, tension: 0.25, pointRadius: 0, borderWidth: 2 }]
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: {
              x: { grid: { display: false }, ticks: { maxTicksLimit: 6 } },
              y: { grid: { color: 'rgba(148,163,184,0.12)' } }
            }
          }
        });
      });
    })();
    return () => { mounted = false; Object.values(charts.current).forEach(c => c.destroy()); };
  }, [from, to]);

  return (
    <div>
      <div className="text-sm text-slate-300 mb-2">채널×지역 스몰멀티</div>
      <div ref={containerRef} />
    </div>
  );
}
