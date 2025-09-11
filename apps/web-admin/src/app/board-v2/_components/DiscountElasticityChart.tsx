'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, TooltipItem } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function DiscountElasticityChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elasticity, setElasticity] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 할인율과 수량 데이터 생성 (Mock)
        const discountData = calendarData.map(d => {
          const discountRate = Math.random() * 0.3; // 0-30% 할인율
          const quantity = Math.max(1, Math.floor(30 + discountRate * 100 + Math.random() * 20 - 10));
          
          return {
            x: discountRate, // 할인율 (0-1)
            y: Math.log(quantity + 1), // log(Q+1)
            discountRate: discountRate,
            quantity: quantity
          };
        });
        
        // 탄력성 계산
        if (discountData.length > 0) {
          const n = discountData.length;
          const sumX = discountData.reduce((sum, d) => sum + d.x, 0);
          const sumY = discountData.reduce((sum, d) => sum + d.y, 0);
          const sumXY = discountData.reduce((sum, d) => sum + d.x * d.y, 0);
          const sumX2 = discountData.reduce((sum, d) => sum + d.x * d.x, 0);
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          // 1%p 할인 시 예상 수량 변화율 계산
          const perPointChange = (Math.exp(slope * 0.01) - 1) * 100;
          
          setElasticity({
            slope: slope.toFixed(2),
            perPointChange: perPointChange.toFixed(2),
            interpretation: `할인율 1%p↑ 시 Q≈ ${perPointChange.toFixed(2)}% 변화(근사)`
          });
          
          setData({
            datasets: [
              {
                label: '행',
                data: discountData,
                backgroundColor: '#2aa775',
                borderColor: '#2aa775',
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: '회귀',
                data: [
                  { x: 0, y: intercept },
                  { x: 1, y: slope + intercept }
                ],
                type: 'line',
                borderColor: '#e25b5b',
                backgroundColor: 'transparent',
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0,
                borderWidth: 2
              }
            ]
          });
        }
      } catch (error) {
        console.error('Failed to fetch discount elasticity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to]);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>할인 탄력성 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>할인율 vs log(Q+1) 분석 중</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>차트를 표시할 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ height: '130px' }}>
        <Scatter
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
                position: 'top' as const,
                labels: {
                  color: '#e7edf5',
                  font: { size: 11 }
                }
              },
              tooltip: {
                backgroundColor: '#101725',
                titleColor: '#e7edf5',
                bodyColor: '#e7edf5',
                borderColor: '#1b2533',
                borderWidth: 1,
                callbacks: {
                  label: function(context: TooltipItem<'scatter'>) {
                    if (context.datasetIndex === 0) {
                      const raw = context.raw as any;
                      return `할인율: ${(Number(context.parsed.x) * 100).toFixed(1)}%, 수량: ${raw?.quantity || 'N/A'}개`;
                    }
                    return context.dataset.label;
                  }
                }
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: '할인율(0~1)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                ticks: { 
                  color: '#9aa0a6', 
                  font: { size: 10 },
                  callback: function(value) {
                    const asNum = (v: string | number) => (typeof v === "number" ? v : Number(v));
                    return `${(asNum(value) * 100).toFixed(0)}%`;
                  }
                },
                grid: { color: '#1b2533' }
              },
              y: {
                title: {
                  display: true,
                  text: 'log(Q+1)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                ticks: { color: '#9aa0a6', font: { size: 10 } },
                grid: { color: '#1b2533' }
              }
            }
          }}
        />
      </div>
      {elasticity && (
        <div className="note" style={{ marginTop: '8px', fontSize: '11px' }}>
          {elasticity.interpretation}
        </div>
      )}
    </>
  );
}
