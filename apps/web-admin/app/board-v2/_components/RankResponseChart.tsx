'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RankResponseChart({ 
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Mock 데이터로 순위별 판매량 생성
        const ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const salesByRank = ranks.map(rank => {
          // 순위가 낮을수록 판매량이 높아지는 패턴
          const baseSales = 50 - (rank - 1) * 3;
          const variation = Math.random() * 10 - 5; // ±5 변동
          return Math.max(5, baseSales + variation);
        });
        
        setData({
          labels: ranks.map(r => `순위 ${r}`),
          datasets: [{
            label: '평균 일판매량 (개)',
            data: salesByRank,
            backgroundColor: ranks.map(rank => {
              // 순위가 낮을수록 더 진한 파란색
              const intensity = (11 - rank) / 10;
              return `rgba(90, 162, 255, ${0.3 + intensity * 0.7})`;
            }),
            borderColor: '#5aa2ff',
            borderWidth: 1
          }]
        });
      } catch (error) {
        console.error('Failed to fetch rank data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>순위 반응곡선 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>진열 순위별 판매량 분석 중</div>
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
    <div style={{ height: '130px' }}>
      <Bar
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: '#101725',
              titleColor: '#e7edf5',
              bodyColor: '#e7edf5',
              borderColor: '#1b2533',
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const rank = context.label;
                  const sales = context.parsed.y;
                  return `${rank}: 평균 ${sales.toFixed(1)}개/일`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 9 },
                maxRotation: 45
              },
              grid: { color: '#1b2533' }
            },
            y: {
              beginAtZero: true,
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 10 },
                callback: function(value) {
                  return `${value}개`;
                }
              },
              grid: { color: '#1b2533' }
            }
          }
        }}
      />
    </div>
  );
}
