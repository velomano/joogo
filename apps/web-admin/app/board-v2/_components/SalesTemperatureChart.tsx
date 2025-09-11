'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SalesTemperatureChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const chartData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 데이터 가공
        const labels = chartData.map(d => d.date);
        const salesData = chartData.map(d => d.revenue / 1000); // 천원 단위로 변환
        const tempData = chartData.map(d => d.tavg || 0);
        
        setData({
          labels,
          datasets: [
            {
              label: '판매량 (천원)',
              data: salesData,
              borderColor: '#5aa2ff',
              backgroundColor: 'rgba(90, 162, 255, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              fill: true
            },
            {
              label: '평균기온 (°C)',
              data: tempData,
              borderColor: '#e25b5b',
              backgroundColor: 'rgba(226, 91, 91, 0.1)',
              yAxisID: 'y1',
              tension: 0.4
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>차트 데이터 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>Mock API에서 데이터를 가져오는 중</div>
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
              type: 'linear',
              display: true,
              position: 'left',
              ticks: { color: '#9aa0a6', font: { size: 10 } },
              grid: { color: '#1b2533' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              ticks: { color: '#9aa0a6', font: { size: 10 } },
              grid: { drawOnChartArea: false }
            }
          }
        }}
      />
    </div>
  );
}
