'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function PriceElasticityChart({ 
  refreshTrigger, 
  from, 
  to 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [elasticity, setElasticity] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 가격과 수량 데이터 생성 (Mock)
        const priceData = calendarData.map(d => {
          const basePrice = 30000;
          const priceVariation = (Math.random() - 0.5) * 10000; // ±5000원 변동
          const price = basePrice + priceVariation;
          const quantity = Math.max(1, Math.floor(50 - (price - 30000) / 1000 + Math.random() * 10 - 5));
          
          return {
            x: Math.log(price), // log-가격
            y: Math.log(quantity + 1), // log(Q+1)
            price: price,
            quantity: quantity
          };
        });
        
        // 탄력성 계산 (log-log 회귀)
        if (priceData.length > 0) {
          const n = priceData.length;
          const sumX = priceData.reduce((sum, d) => sum + d.x, 0);
          const sumY = priceData.reduce((sum, d) => sum + d.y, 0);
          const sumXY = priceData.reduce((sum, d) => sum + d.x * d.y, 0);
          const sumX2 = priceData.reduce((sum, d) => sum + d.x * d.x, 0);
          
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          const minX = Math.min(...priceData.map(d => d.x));
          const maxX = Math.max(...priceData.map(d => d.x));
          
          setElasticity({
            slope: slope.toFixed(2),
            interpretation: `가격 탄력성 ≈ ${slope.toFixed(2)} (log-log)`
          });
          
          setData({
            datasets: [
              {
                label: '행',
                data: priceData,
                backgroundColor: '#5aa2ff',
                borderColor: '#5aa2ff',
                pointRadius: 4,
                pointHoverRadius: 6
              },
              {
                label: '회귀',
                data: [
                  { x: minX, y: slope * minX + intercept },
                  { x: maxX, y: slope * maxX + intercept }
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
        console.error('Failed to fetch price elasticity data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>가격 탄력성 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>log-가격 vs log(Q+1) 분석 중</div>
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
                borderWidth: 1
              }
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'log(유효가격)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                ticks: { color: '#9aa0a6', font: { size: 10 } },
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
