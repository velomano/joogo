'use client';
import { useEffect, useRef } from 'react';
import { Chart, chartDefaults, colorPalette } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

export default function FunnelDual({ from, to }: { from: string; to: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await Adapters.funnel({ from, to }, {});
      if (!mounted || !canvasRef.current) return;

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // 데이터 그룹화
      const marketingData = data.filter((item: any) => item.group === 'marketing');
      const merchantData = data.filter((item: any) => item.group === 'merchant');

      const stages = [...new Set(data.map((item: any) => item.stage))].sort();

      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: stages,
          datasets: [
            {
              label: '마케팅',
              data: stages.map(stage => {
                const item = marketingData.find((d: any) => d.stage === stage);
                return item ? item.value : 0;
              }),
              backgroundColor: '#3b82f6',
              borderColor: '#2563eb',
              borderWidth: 1
            },
            {
              label: '머천트',
              data: stages.map(stage => {
                const item = merchantData.find((d: any) => d.stage === stage);
                return item ? item.value : 0;
              }),
              backgroundColor: '#10b981',
              borderColor: '#059669',
              borderWidth: 1
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top' as const,
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                font: { size: 10 }
              }
            },
            tooltip: {
              callbacks: {
                label: (context: any) => {
                  return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: {
                font: { size: 10 }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback: (value: any) => {
                  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
                  return value.toString();
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
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">
          <span className="text-sm">🔄</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">마케팅/머천트 이중 퍼널</h3>
          <p className="text-xs text-gray-500">Marketing & Merchant Funnel</p>
        </div>
      </div>
      
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      <div className="mt-4 p-3 bg-orange-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-orange-900">전환 분석</p>
            <p className="text-xs text-orange-700">마케팅 vs 머천트</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-orange-900">Funnel Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}