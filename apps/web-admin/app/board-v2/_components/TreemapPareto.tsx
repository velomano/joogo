'use client';
import { useEffect, useRef, useState } from 'react';
import { Chart } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

type Node = { category:string; sku:string; revenue:number; roas?:number };
type Pareto = { sku:string; revenue:number; cumPct:number; category:string };

export default function TreemapPareto({ from, to }: { from:string; to:string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [topList, setTopList] = useState<Pareto[]>([]);
  const chartRef = useRef<Chart|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows: Node[] = await Adapters.treemapPareto({ from, to }, {});
      if (!mounted) return;

      const total = rows.reduce((a,b)=>a+b.revenue, 0) || 1;
      const sorted = [...rows].sort((a,b)=>b.revenue-a.revenue);
      let acc = 0;
      const pareto: Pareto[] = sorted.map(r => {
        acc += r.revenue;
        return { sku: r.sku, revenue: r.revenue, cumPct: acc/total, category: r.category };
      });
      setTopList(pareto.slice(0, 10));

      const ctx = canvasRef.current!.getContext('2d')!;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      chartRef.current = new Chart(ctx, {
        type: 'treemap' as any,
        data: {
          datasets: [{
            tree: rows.map(r => ({ category:r.category, sku:r.sku, value:r.revenue })),
            key: 'value',
            groups: ['category'],
            spacing: 1,
            borderColor: 'rgba(30,41,59,0.6)',
            borderWidth: 1,
            captions: {
              display: true,
              align: 'center',
              color: 'rgba(226,232,240,0.95)',
              formatter: (ctx:any) => `${ctx.raw.sku}\n₩${(ctx.raw.value||0).toLocaleString()}`
            }
          } as any]
        },
        options: { 
          maintainAspectRatio: false,
          plugins: { legend: { display:false }, tooltip: { enabled: false } } 
        }
      });
    })();
    return () => { mounted=false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-3 rounded-2xl bg-slate-800/40 border border-slate-700 p-4">
        <div className="text-sm text-slate-300 mb-2">카테고리/상품 Treemap</div>
        <div className="h-64">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
      <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-4">
        <div className="text-sm text-slate-300 mb-2">Pareto Top 10</div>
        <ol className="text-slate-200 text-sm space-y-1">
          {topList.map((r,i)=>(
            <li key={r.sku} className="flex items-center justify-between">
              <span className="opacity-80">{i+1}. {r.sku}</span>
              <span className="opacity-70">₩{r.revenue.toLocaleString()} · {(r.cumPct*100).toFixed(1)}%</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
