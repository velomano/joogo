'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function RevenueSpendChart() {
  console.log('RevenueSpendChart 컴포넌트 렌더링 시작');
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('RevenueSpendChart 시작 - 날짜 범위:', { from, to });
        const chartData = await Adapters.calendarHeatmap({ from, to }, {});
        console.log('RevenueSpendChart 원본 데이터 샘플:', chartData.slice(0, 3));
        console.log('RevenueSpendChart 전체 데이터 개수:', chartData.length);
        
        // 데이터 가공
        const labels = chartData.map(d => d.date);
        const revenueData = chartData.map(d => d.revenue / 1000000); // 백만원 단위로 변환
        const spendData = chartData.map(d => {
          // spend가 없으면 roas로부터 계산: spend = revenue / roas
          // roas가 0이거나 없으면 기본값 2.0 사용
          const roas = d.roas || 2.0;
          const spend = d.spend || (roas > 0 ? d.revenue / roas : d.revenue / 2.0);
          return spend / 1000000; // 백만원 단위로 변환
        });
        const roasData = chartData.map(d => d.roas || 2.0);
        
        // 계산된 데이터 확인
        const totalRevenue = revenueData.reduce((sum, val) => sum + val, 0);
        const totalSpend = spendData.reduce((sum, val) => sum + val, 0);
        const avgRoas = roasData.reduce((sum, val) => sum + val, 0) / roasData.length;
        
        console.log('RevenueSpendChart 계산 결과:', {
          totalRevenue: `${totalRevenue.toFixed(1)}M원`,
          totalSpend: `${totalSpend.toFixed(1)}M원`,
          avgRoas: avgRoas.toFixed(2),
          dataLength: chartData.length,
          sampleData: {
            revenue: revenueData.slice(0, 3),
            spend: spendData.slice(0, 3),
            roas: roasData.slice(0, 3)
          }
        });
        
        const chartDataObj = {
          labels,
          datasets: [
            {
              label: '매출 (백만원)',
              data: revenueData,
              borderColor: '#2aa775',
              backgroundColor: 'rgba(42, 167, 117, 0.1)',
              yAxisID: 'y',
              tension: 0.4,
              fill: true
            },
            {
              label: '광고비 (백만원)',
              data: spendData,
              borderColor: '#e0a400',
              backgroundColor: 'rgba(224, 164, 0, 0.1)',
              yAxisID: 'y',
              tension: 0.4
            },
            {
              label: 'ROAS',
              data: roasData,
              borderColor: '#5aa2ff',
              backgroundColor: 'rgba(90, 162, 255, 0.1)',
              yAxisID: 'y1',
              tension: 0.4
            }
          ]
        };
        
        console.log('RevenueSpendChart 차트 데이터 설정:', {
          labelsCount: labels.length,
          revenueDataSample: revenueData.slice(0, 3),
          spendDataSample: spendData.slice(0, 3),
          roasDataSample: roasData.slice(0, 3)
        });
        
        setData(chartDataObj);
      } catch (error) {
        console.error('Failed to fetch chart data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to]);

  console.log('RevenueSpendChart 렌더링 상태:', { loading, hasData: !!data, dataKeys: data ? Object.keys(data) : null });

  if (loading) {
    console.log('RevenueSpendChart 로딩 중...');
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
    console.log('RevenueSpendChart 데이터 없음');
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>차트를 표시할 수 없습니다</div>
        </div>
      </div>
    );
  }

  console.log('RevenueSpendChart 차트 렌더링:', { hasData: !!data, dataKeys: data ? Object.keys(data) : null });

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
