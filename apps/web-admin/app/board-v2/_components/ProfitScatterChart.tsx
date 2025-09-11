'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProfitScatterChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [correlation, setCorrelation] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 할인율과 이익 데이터 생성 (Mock)
        const scatterData = calendarData.map(d => {
          const discountRate = Math.random() * 0.3; // 0-30% 할인율
          const revenue = d.revenue;
          const cost = revenue * 0.6; // 원가 60%
          const profit = revenue - cost;
          return {
            x: discountRate * 100, // 퍼센트로 변환
            y: profit / 1000 // 천원 단위로 변환
          };
        });
        
        // 상관관계 계산
        if (scatterData.length > 0) {
          const n = scatterData.length;
          const sumX = scatterData.reduce((sum, d) => sum + d.x, 0);
          const sumY = scatterData.reduce((sum, d) => sum + d.y, 0);
          const sumXY = scatterData.reduce((sum, d) => sum + d.x * d.y, 0);
          const sumX2 = scatterData.reduce((sum, d) => sum + d.x * d.x, 0);
          const sumY2 = scatterData.reduce((sum, d) => sum + d.y * d.y, 0);
          
          const r = (n * sumXY - sumX * sumY) / 
                   Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
          
          // 회귀선 계산
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
          const intercept = (sumY - slope * sumX) / n;
          
          const minX = Math.min(...scatterData.map(d => d.x));
          const maxX = Math.max(...scatterData.map(d => d.x));
          
          setCorrelation({
            r: r.toFixed(2),
            strength: Math.abs(r) < 0.2 ? '미약' : 
                     Math.abs(r) < 0.4 ? '약함' : 
                     Math.abs(r) < 0.6 ? '보통' : 
                     Math.abs(r) < 0.8 ? '강함' : '매우 강함',
            slope: slope.toFixed(2),
            perPointChange: (Math.exp(slope * 0.01) - 1).toFixed(2)
          });
        }
        
        setData({
          datasets: [
            {
              label: '행',
              data: scatterData,
              backgroundColor: '#2aa775',
              borderColor: '#2aa775',
              pointRadius: 4,
              pointHoverRadius: 6
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch profit scatter data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>산점도 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>할인율과 이익 상관관계 분석 중</div>
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
                    return `할인율: ${context.parsed.x.toFixed(1)}%, 이익: ${context.parsed.y.toFixed(0)}천원`;
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
                    return `${value}%`;
                  }
                },
                grid: { color: '#1b2533' }
              },
              y: {
                title: {
                  display: true,
                  text: '이익(천원)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                beginAtZero: true,
                ticks: { 
                  color: '#9aa0a6', 
                  font: { size: 10 },
                  callback: function(value) {
                    return `${value}천원`;
                  }
                },
                grid: { color: '#1b2533' }
              }
            }
          }}
        />
      </div>
      {correlation && (
        <div className="note" style={{ marginTop: '8px', fontSize: '11px' }}>
          해석: r≈{correlation.r}({correlation.strength}). 할인율 1%p↑ 시 이익 {correlation.perPointChange}% 변화(근사).
        </div>
      )}
    </>
  );
}
