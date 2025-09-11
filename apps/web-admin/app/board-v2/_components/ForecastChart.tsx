'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function ForecastChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 수량 데이터 추출
        const quantities = calendarData.map(d => Math.floor(d.revenue / 50000)); // Mock 수량
        const labels = calendarData.map(d => d.date);
        
        // 7일 이동평균 계산
        const movingAvg: number[] = [];
        for (let i = 0; i < quantities.length; i++) {
          const start = Math.max(0, i - 6);
          const slice = quantities.slice(start, i + 1);
          const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
          movingAvg.push(avg);
        }
        
        // 미래 7일 예측 (마지막 이동평균값 사용)
        const lastMA = movingAvg[movingAvg.length - 1] || 0;
        const futureDays = 7;
        const futureLabels: string[] = [];
        const futureValues: number[] = [];
        
        if (labels.length > 0) {
          const lastDate = new Date(labels[labels.length - 1]);
          for (let i = 1; i <= futureDays; i++) {
            const futureDate = new Date(lastDate);
            futureDate.setDate(lastDate.getDate() + i);
            futureLabels.push(futureDate.toISOString().split('T')[0]);
            futureValues.push(lastMA);
          }
        }
        
        // 실제 데이터에 null 패딩 추가
        const actualWithPadding = [...quantities, ...new Array(futureDays).fill(null)];
        const maWithPadding = [...movingAvg, ...new Array(futureDays).fill(null)];
        const forecastWithPadding = [...new Array(quantities.length).fill(null), ...futureValues];
        
        setData({
          labels: [...labels, ...futureLabels],
          datasets: [
            {
              label: '실제',
              data: actualWithPadding,
              borderColor: '#5aa2ff',
              backgroundColor: 'rgba(90, 162, 255, 0.1)',
              fill: false,
              tension: 0.4,
              pointRadius: 2,
              pointHoverRadius: 4
            },
            {
              label: '7일 이동평균',
              data: maWithPadding,
              borderColor: '#2aa775',
              backgroundColor: 'rgba(42, 167, 117, 0.1)',
              fill: false,
              tension: 0.4,
              borderDash: [5, 5],
              pointRadius: 2,
              pointHoverRadius: 4
            },
            {
              label: '7일 예측',
              data: forecastWithPadding,
              borderColor: '#e25b5b',
              backgroundColor: 'rgba(226, 91, 91, 0.1)',
              fill: false,
              tension: 0.4,
              borderDash: [10, 5],
              pointRadius: 3,
              pointHoverRadius: 5
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch forecast data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>예측 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>7일 이동평균 기반 예측 중</div>
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
      <Line
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
              ticks: { color: '#9aa0a6', font: { size: 10 } },
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
