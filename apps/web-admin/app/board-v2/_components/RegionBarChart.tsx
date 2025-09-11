'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function RegionBarChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const chartData = await Adapters.channelRegion({ from, to }, {});
        
        // 지역별 매출 집계
        const regionMap = new Map<string, number>();
        chartData.forEach(item => {
          const region = item.region || '기타';
          regionMap.set(region, (regionMap.get(region) || 0) + item.revenue);
        });
        
        const labels = Array.from(regionMap.keys());
        const values = Array.from(regionMap.values());
        
        setData({
          labels,
          datasets: [{
            label: '매출 (백만원)',
            data: values.map(v => v / 1000000), // 백만원 단위로 변환
            backgroundColor: '#5aa2ff',
            borderColor: '#1b2533',
            borderWidth: 1
          }]
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
      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>바차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>지역별 매출 데이터 분석 중</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>차트를 표시할 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '180px' }}>
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
                  return `매출: ₩${(context.parsed.y * 1000000).toLocaleString()}원`;
                }
              }
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
                  return `₩${value}M`;
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
