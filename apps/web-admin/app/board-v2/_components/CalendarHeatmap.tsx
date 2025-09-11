'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Chart } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

type Cell = { x: number; y: number; v: number; date: string; event?: boolean };

function weekOfYear(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date as any) - (yearStart as any)) / 86400000 + 1) / 7);
}
function dayOfWeek(d: Date) {
  const w = d.getDay(); // 0=Sun
  return w === 0 ? 6 : w - 1; // 0=Mon..6=Sun 기준
}

export default function CalendarHeatmap({ from, to }: { from: string; to: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  const fetchData = async () => {
    return await Adapters.calendarHeatmap({ from, to }, {});
  };

  const compute = (rows: {date:string; revenue:number; is_event?:boolean}[]): {cells:Cell[], min:number, max:number, weekMin:number, weekMax:number} => {
    if (!rows?.length) return { cells:[], min:0, max:0, weekMin:1, weekMax:53 };
    let min = Number.MAX_VALUE, max = 0, wmin = 60, wmax = 0;
    const cells: Cell[] = rows.map(r => {
      const d = new Date(r.date+'T00:00:00');
      const w = weekOfYear(d);
      const y = dayOfWeek(d);
      min = Math.min(min, r.revenue);
      max = Math.max(max, r.revenue);
      wmin = Math.min(wmin, w);
      wmax = Math.max(wmax, w);
      return { x: w, y, v: r.revenue, date: r.date, event: r.is_event };
    });
    return { cells, min, max, weekMin: wmin, weekMax: wmax };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await fetchData();
      if (!mounted) return;
      const { cells, min, max, weekMin, weekMax } = compute(rows);

      const ctx = canvasRef.current!.getContext('2d')!;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const width = 18, height = 18;

      chartRef.current = new Chart(ctx, {
        type: 'matrix',
        data: {
          datasets: [{
            label: 'Daily Revenue',
            data: cells.map(c => ({ x: c.x, y: c.y, v: c.v, date: c.date, event: c.event })),
            width: () => width,
            height: () => height,
            backgroundColor: (ctx) => {
              const v = (ctx.raw as any).v || 0;
              const ratio = max === min ? 0.5 : (v - min) / (max - min);
              const a = 0.15 + 0.75 * ratio;
              return `rgba(56,189,248,${a})`; // sky-400 계열
            },
            borderColor: (ctx) => (ctx.raw as any).event ? 'rgba(250,204,21,0.9)' : 'rgba(30,41,59,0.6)',
            borderWidth: (ctx) => (ctx.raw as any).event ? 2 : 1,
          }]
        },
        options: {
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (i) => {
                  const r:any = i.raw;
                  return `${r.date}: ₩${(r.v||0).toLocaleString()}${r.event?' (event)':''}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'linear',
              ticks: {
                callback: (v: string | number) => `W${Number(v)|0}`,
                autoSkip: true, maxTicksLimit: 12,
              },
              min: weekMin - 0.5, max: weekMax + 0.5, grid: { display:false }
            },
            y: {
              type: 'linear',
              ticks: { callback: (v: string | number) => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][Number(v)] },
              min: -0.5, max: 6.5, grid: { display:false }
            }
          }
        }
      });
    })();
    return () => { mounted = false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="rounded-2xl bg-slate-800/40 border border-slate-700 p-4">
      <div className="text-sm text-slate-300 mb-2">성과 캘린더 히트맵</div>
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
