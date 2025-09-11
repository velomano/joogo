'use client';
import { useEffect, useRef } from 'react';
import { Chart } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

type F = { stage:string; value:number; group:'marketing'|'merchant' };

const STAGES = ['impr','clicks','orders'];

export default function FunnelDual({ from, to }: { from:string; to:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows: F[] = await Adapters.funnel({ from, to }, {});
      if (!mounted) return;

      const byGroup: Record<'marketing'|'merchant', Record<string, number>> = { marketing:{}, merchant:{} };
      for (const s of STAGES) { byGroup.marketing[s]=0; byGroup.merchant[s]=0; }
      rows.forEach(r => { byGroup[r.group][r.stage] = (byGroup[r.group][r.stage]||0) + r.value; });

      const labels = ['노출','클릭','주문'];
      const marketing = STAGES.map(s => byGroup.marketing[s]||0);
      const merchant  = STAGES.map(s => byGroup.merchant[s]||0);

      const ctx = canvasRef.current!.getContext('2d')!;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Marketing', data: marketing, barPercentage: 0.5 },
            { label: 'Merchant', data: merchant, barPercentage: 0.5 }
          ]
        },
        options: {
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { position: 'bottom' } },
          scales: {
            x: { grid: { color:'rgba(148,163,184,0.12)' } },
            y: { grid: { display:false } }
          }
        }
      });
    })();
    return () => { mounted=false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-4">
      <div className="text-sm text-slate-300 mb-2">마케팅/머천트 이중 퍼널</div>
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
