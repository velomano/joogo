'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export default function ParetoChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [abcInfo, setAbcInfo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const chartData = await Adapters.treemapPareto({ from, to }, {});
        
        // SKU별 매출 정렬
        const sortedData = chartData
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10); // 상위 10개만 표시
        
        const labels = sortedData.map(item => item.sku);
        const values: number[] = sortedData.map(item => item.revenue / 1000000); // 백만원 단위
        
        // 누적 비율 계산
        const total = values.reduce((sum, val) => sum + val, 0);
        const cumulative: number[] = [];
        let acc = 0;
        for (let i = 0; i < values.length; i++) {
          acc += values[i];
          cumulative.push((acc / total) * 100);
        }
        
        // ABC 분석
        const aCount = cumulative.filter(c => c <= 80).length;
        const bCount = cumulative.filter(c => c > 80 && c <= 95).length;
        const cCount = values.length - aCount - bCount;
        setAbcInfo(`ABC: A=${aCount}개(≈80%), B=${bCount}개(≈15%), C=${cCount}개`);
        
        setData({
          labels,
          datasets: [
            {
              type: 'bar',
              label: '매출 (백만원)',
              data: values,
              backgroundColor: '#5aa2ff',
              borderColor: '#1b2533',
              borderWidth: 1,
              yAxisID: 'y'
            },
            {
              type: 'line',
              label: '누적 비율 (%)',
              data: cumulative,
              borderColor: '#e25b5b',
              backgroundColor: 'rgba(226, 91, 91, 0.1)',
              fill: false,
              tension: 0.4,
              yAxisID: 'y1'
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
      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>파레토차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>ABC 분석 데이터 처리 중</div>
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
    <>
      <div style={{ height: '180px' }}>
        <Bar
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
                  font: { size: 10 }
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
                ticks: { color: '#9aa0a6', font: { size: 9 } },
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
                    return `₩${value}M`;
                  }
                },
                grid: { color: '#1b2533' }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 100,
                ticks: { 
                  color: '#9aa0a6', 
                  font: { size: 10 },
                  callback: function(value) {
                    return `${value}%`;
                  }
                },
                grid: { drawOnChartArea: false }
              }
            }
          }}
        />
      </div>
      <div className="note" style={{ marginTop: '8px', fontSize: '11px' }}>{abcInfo}</div>
    </>
  );
}
