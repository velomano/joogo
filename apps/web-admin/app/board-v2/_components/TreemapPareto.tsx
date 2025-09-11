'use client';
import { useEffect, useRef } from 'react';
import { Chart, chartDefaults, colorPalette } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

export default function TreemapPareto({ from, to }: { from: string; to: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await Adapters.treemapPareto({ from, to }, {});
      if (!mounted || !canvasRef.current) return;

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // 데이터 정렬 및 누적 비율 계산
      const sortedData = data.sort((a: any, b: any) => b.revenue - a.revenue);
      const totalRevenue = sortedData.reduce((sum: number, item: any) => sum + item.revenue, 0);
      
      let cumulativeRevenue = 0;
      const chartData = sortedData.slice(0, 10).map((item: any, index: number) => {
        cumulativeRevenue += item.revenue;
        return {
          x: item.sku,
          y: item.revenue,
          cumulative: (cumulativeRevenue / totalRevenue) * 100
        };
      });

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartData.map((item: any) => item.x),
          datasets: [{
            label: '매출',
            data: chartData.map((item: any) => item.y),
            backgroundColor: chartData.map((_, index) => colorPalette[index % colorPalette.length]),
            borderColor: chartData.map((_, index) => colorPalette[index % colorPalette.length]),
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  const item = chartData[context.dataIndex];
                  return `매출: ₩${item.y.toLocaleString()}`;
                },
                afterLabel: (context: any) => {
                  const item = chartData[context.dataIndex];
                  return `누적: ${item.cumulative.toFixed(1)}%`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                maxRotation: 45,
                font: { size: 10 }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  if (value >= 1000000) return `₩${(value / 1000000).toFixed(1)}M`;
                  if (value >= 1000) return `₩${(value / 1000).toFixed(0)}K`;
                  return `₩${value}`;
                }
              }
            }
          }
        }
      });
    })();
    return () => { mounted = false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-purple-500 to-purple-600">
          <span className="text-sm">📊</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">카테고리/상품 Treemap</h3>
          <p className="text-xs text-gray-500">Product Analysis</p>
        </div>
      </div>
      
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      <div className="mt-4 p-3 bg-purple-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-purple-900">Pareto Top 10</p>
            <p className="text-xs text-purple-700">ABC Analysis</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-purple-900">Product Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}