'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SkuDetailChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSku, setSelectedSku] = useState('TOPS-001');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // SKU별 데이터 가져오기
        const skuData = await Adapters.treemapPareto({ from, to }, {});
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 선택된 SKU의 데이터 필터링 (Mock 데이터에서는 전체 데이터를 사용)
        const labels = calendarData.map(d => d.date);
        const salesData = calendarData.map(d => Math.floor(Math.random() * 20) + 5); // Mock SKU 판매량
        const tempData = calendarData.map(d => d.tavg || 0);
        
        // 7일 이동평균 계산
        const movingAvg = [];
        for (let i = 0; i < salesData.length; i++) {
          const start = Math.max(0, i - 6);
          const slice = salesData.slice(start, i + 1);
          const avg = slice.reduce((sum, val) => sum + val, 0) / slice.length;
          movingAvg.push(avg);
        }
        
        setData({
          labels,
          datasets: [
            {
              label: '판매량',
              data: salesData,
              borderColor: '#5aa2ff',
              backgroundColor: 'rgba(90, 162, 255, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              fill: true
            },
            {
              label: '7일 이동평균',
              data: movingAvg,
              borderColor: '#2aa775',
              backgroundColor: 'rgba(42, 167, 117, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              borderDash: [5, 5]
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
        console.error('Failed to fetch SKU data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, selectedSku]);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>SKU 상세 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>선택된 SKU 데이터 분석 중</div>
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
              beginAtZero: true,
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 10 },
                callback: function(value) {
                  return `${value}개`;
                }
              },
              grid: { color: '#1b2533' }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 10 },
                callback: function(value) {
                  return `${value}°C`;
                }
              },
              grid: { drawOnChartArea: false }
            }
          }
        }}
      />
    </div>
  );
}
