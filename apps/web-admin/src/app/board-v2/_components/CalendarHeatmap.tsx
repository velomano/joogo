'use client';
import { useEffect, useMemo, useRef } from 'react';
import { Chart, chartDefaults, colorPalette } from '@/lib/lib/chart';
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
    const cells: Cell[] = [];
    for (const r of rows) {
      const d = new Date(r.date);
      const week = weekOfYear(d);
      const day = dayOfWeek(d);
      const v = r.revenue;
      if (v > 0) {
        min = Math.min(min, v);
        max = Math.max(max, v);
        wmin = Math.min(wmin, week);
        wmax = Math.max(wmax, week);
        cells.push({ x: day, y: week, v, date: r.date, event: r.is_event });
      }
    }
    return { cells, min, max, weekMin: wmin, weekMax: wmax };
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      const rows = await fetchData();
      if (!mounted || !canvasRef.current) return;
      const { cells, min, max, weekMin, weekMax } = compute(rows);
      
      if (chartRef.current) chartRef.current.destroy();
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: cells.map(c => c.date),
          datasets: [{
            label: '매출',
            data: cells.map(c => c.v),
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: '#3b82f6',
            pointHoverBorderColor: '#ffffff',
            pointHoverBorderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (context: any) => {
                  const point = context[0].raw;
                  return new Date(point.date).toLocaleDateString('ko-KR');
                },
                label: (context: any) => {
                  const point = context.raw;
                  return `매출: ₩${point.v.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              type: 'time' as const,
              time: {
                parser: 'yyyy-MM-dd',
                displayFormats: { day: 'MM/dd' }
              },
              ticks: { maxTicksLimit: 8 }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  const asNum = (v: string | number) => (typeof v === "number" ? v : Number(v));
                  const numValue = asNum(value);
                  if (numValue >= 1000000) return `₩${(numValue / 1000000).toFixed(1)}M`;
                  if (numValue >= 1000) return `₩${(numValue / 1000).toFixed(0)}K`;
                  return `₩${numValue}`;
                }
              }
            }
          },
          interaction: {
            intersect: false,
            mode: 'point' as const
          }
        }
      });
    })();
    return () => { mounted = false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-blue-500 to-blue-600">
          <span className="text-sm">📅</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">일별 매출 추이</h3>
          <p className="text-xs text-gray-500">Daily Sales Trend</p>
        </div>
      </div>
      
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-blue-900">일평균 매출 1,250,000원</p>
            <p className="text-xs text-blue-700">최고일: 2025-01-15</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-blue-900">Product Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
