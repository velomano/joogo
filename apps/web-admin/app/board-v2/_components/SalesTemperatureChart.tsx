'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function SalesTemperatureChart({ 
  refreshTrigger, 
  from, 
  to, 
  region = [], 
  channel = [], 
  category = [], 
  sku = [] 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
  region?: string[];
  channel?: string[];
  category?: string[];
  sku?: string[];
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('SalesTemperatureChart 날짜 범위:', { from, to }); // 디버깅용
        const chartData = await Adapters.calendarHeatmap(
          { from: from as string, to: to as string }, 
          { region, channel, category, sku }
        );
        console.log('SalesTemperatureChart 받은 데이터 개수:', chartData.length); // 디버깅용
        
        // 필터에 맞게 데이터 필터링
        let filteredData = chartData;
        
        // 날짜 범위 필터링 (이미 API에서 처리되지만 이중 체크)
        filteredData = filteredData.filter(d => {
          const date = new Date(d.date);
          return date >= new Date(from) && date <= new Date(to);
        });
        
        // 오늘 데이터만 표시하도록 필터링
        const today = new Date().toISOString().slice(0, 10);
        if (from === today && to === today) {
          filteredData = filteredData.filter(d => d.date === today);
        }
        
        console.log('필터링 후 데이터 개수:', filteredData.length); // 디버깅용
        
        // 데이터 가공 - 날짜 범위에 따라 포맷 조정
        const dateRange = new Date(to).getTime() - new Date(from).getTime();
        const daysDiff = Math.ceil(dateRange / (1000 * 60 * 60 * 24));
        
        console.log('날짜 범위:', { from, to, daysDiff, dataLength: filteredData.length });
        
        let labels, salesData, tempData;
        
        if (daysDiff <= 7) {
          // 1주일 이하: 일별 상세 표시 (모든 데이터 포인트 사용)
          labels = filteredData.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });
          salesData = filteredData.map(d => d.revenue / 1000);
          tempData = filteredData.map(d => d.tavg || 0);
        } else if (daysDiff <= 31) {
          // 1개월 이하: 일별 표시 (모든 데이터 포인트 사용)
          labels = filteredData.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });
          salesData = filteredData.map(d => d.revenue / 1000);
          tempData = filteredData.map(d => d.tavg || 0);
        } else if (daysDiff <= 90) {
          // 3개월 이하: 주별 집계 (7일씩 묶어서)
          const weeklyData = [];
          for (let i = 0; i < filteredData.length; i += 7) {
            const weekData = filteredData.slice(i, i + 7);
            if (weekData.length > 0) {
              const weekRevenue = weekData.reduce((sum, d) => sum + d.revenue, 0);
              const weekTemp = weekData.reduce((sum, d) => sum + (d.tavg || 0), 0) / weekData.length;
              weeklyData.push({
                date: weekData[0].date,
                revenue: weekRevenue,
                tavg: weekTemp
              });
            }
          }
          labels = weeklyData.map((d, index) => `W${index + 1}`);
          salesData = weeklyData.map(d => d.revenue / 1000);
          tempData = weeklyData.map(d => d.tavg);
        } else {
          // 3개월 초과: 월별 집계
          const monthlyData = [];
          const monthMap = new Map();
          filteredData.forEach(d => {
            const date = new Date(d.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthMap.has(monthKey)) {
              monthMap.set(monthKey, { revenue: 0, temp: 0, count: 0 });
            }
            const monthData = monthMap.get(monthKey);
            monthData.revenue += d.revenue;
            monthData.temp += d.tavg || 0;
            monthData.count += 1;
          });
          
          monthMap.forEach((data, monthKey) => {
            monthlyData.push({
              date: monthKey,
              revenue: data.revenue,
              tavg: data.temp / data.count
            });
          });
          
          // 월별 데이터를 날짜순으로 정렬
          monthlyData.sort((a, b) => a.date.localeCompare(b.date));
          
          labels = monthlyData.map(d => d.date);
          salesData = monthlyData.map(d => d.revenue / 1000);
          tempData = monthlyData.map(d => d.tavg);
        }
        
        console.log('차트 데이터 포맷:', { 
          daysDiff, 
          labelsCount: labels.length, 
          sampleLabels: labels.slice(0, 5),
          sampleSales: salesData.slice(0, 5)
        });
        
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
  }, [from, to, region, channel, category, sku, refreshTrigger]);

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
