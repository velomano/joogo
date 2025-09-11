'use client';
import { useEffect, useRef } from 'react';
import { Chart, chartDefaults, colorPalette } from '@/lib/lib/chart';
import { Adapters } from '../_data/adapters';

export default function ChannelRegionSmallMultiples({ from, to }: { from: string; to: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart|null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const data = await Adapters.channelRegion({ from, to }, {});
      if (!mounted || !canvasRef.current) return;

      if (chartRef.current) chartRef.current.destroy();

      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // 데이터 그룹화
      const grouped = data.reduce((acc: any, item: any) => {
        const key = `${item.channel}-${item.region}`;
        if (!acc[key]) {
          acc[key] = { channel: item.channel, region: item.region, data: [] };
        }
        acc[key].data.push(item);
        return acc;
      }, {});

      const datasets = Object.values(grouped).map((group: any, index: number) => ({
        label: `${group.channel} - ${group.region}`,
        data: group.data.map((item: any) => ({
          x: item.date,
          y: item.revenue
        })),
        borderColor: Object.values(colorPalette)[index % Object.keys(colorPalette).length],
        backgroundColor: Object.values(colorPalette)[index % Object.keys(colorPalette).length] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4
      }));

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: { datasets },
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
                title: (context: any) => {
                  return new Date(context[0].parsed.x).toLocaleDateString('ko-KR');
                },
                label: (context: any) => {
                  return `${context.dataset.label}: ₩${context.parsed.y.toLocaleString()}`;
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
              ticks: { maxTicksLimit: 6 }
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
          }
        }
      });
    })();
    return () => { mounted = false; if (chartRef.current) chartRef.current.destroy(); };
  }, [from, to]);

  return (
    <div className="w-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-green-600">
          <span className="text-sm">🌍</span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">채널×지역 스몰멀티</h3>
          <p className="text-xs text-gray-500">Channel x Region Analysis</p>
        </div>
      </div>
      
      <div className="h-64">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
      
      <div className="mt-4 p-3 bg-green-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-green-900">지역별 성과</p>
            <p className="text-xs text-green-700">채널별 매출 분석</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-green-900">Performance Analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
