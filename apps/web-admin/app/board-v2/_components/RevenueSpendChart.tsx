'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export default function RevenueSpendChart({ 
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
        
        // 판매 데이터와 광고비 데이터를 병렬로 가져오기
        const [chartData, adsData] = await Promise.all([
          Adapters.calendarHeatmap(
            { from: from as string, to: to as string }, 
            { region, channel, category, sku }
          ),
          Adapters.ads(
            { from: from as string, to: to as string }, 
            { region, channel, category, sku }
          )
        ]);
        
        // 데이터 가공 - 날짜 범위에 따라 포맷 조정
        const dateRange = new Date(to).getTime() - new Date(from).getTime();
        const daysDiff = Math.ceil(dateRange / (1000 * 60 * 60 * 24));
        
        console.log('RevenueSpendChart 날짜 범위:', { from, to, daysDiff, dataLength: chartData.length });
        console.log('광고비 데이터:', adsData.length, '개');
        
        // 광고비 데이터를 날짜별로 그룹화
        const adsByDate = new Map();
        adsData.forEach((ad: any) => {
          const date = ad.ts.split('T')[0];
          if (!adsByDate.has(date)) {
            adsByDate.set(date, { cost: 0, impressions: 0, clicks: 0 });
          }
          const dayData = adsByDate.get(date);
          dayData.cost += ad.cost;
          dayData.impressions += ad.impressions;
          dayData.clicks += ad.clicks;
        });
        
        let labels, revenueData, spendData, roasData;
        
        if (daysDiff <= 7) {
          // 1주일 이하: 일별 상세 표시 (모든 데이터 포인트 사용)
          labels = chartData.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });
          revenueData = chartData.map(d => d.revenue / 1000000);
          spendData = chartData.map(d => {
            const date = d.date;
            const adsData = adsByDate.get(date);
            return adsData ? adsData.cost / 1000000 : 0;
          });
          roasData = chartData.map(d => {
            const date = d.date;
            const adsData = adsByDate.get(date);
            return adsData && adsData.cost > 0 ? d.revenue / adsData.cost : 0;
          });
        } else if (daysDiff <= 31) {
          // 1개월 이하: 일별 표시 (모든 데이터 포인트 사용)
          labels = chartData.map(d => {
            const date = new Date(d.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          });
          revenueData = chartData.map(d => d.revenue / 1000000);
          spendData = chartData.map(d => {
            const date = d.date;
            const adsData = adsByDate.get(date);
            return adsData ? adsData.cost / 1000000 : 0;
          });
          roasData = chartData.map(d => {
            const date = d.date;
            const adsData = adsByDate.get(date);
            return adsData && adsData.cost > 0 ? d.revenue / adsData.cost : 0;
          });
        } else if (daysDiff <= 90) {
          // 3개월 이하: 주별 집계 (7일씩 묶어서)
          const weeklyData = [];
          for (let i = 0; i < chartData.length; i += 7) {
            const weekData = chartData.slice(i, i + 7);
            if (weekData.length > 0) {
              const weekRevenue = weekData.reduce((sum, d) => sum + d.revenue, 0);
              const weekSpend = weekData.reduce((sum, d) => {
                const adsData = adsByDate.get(d.date);
                return sum + (adsData ? adsData.cost : 0);
              }, 0);
              weeklyData.push({
                date: weekData[0].date,
                revenue: weekRevenue,
                spend: weekSpend
              });
            }
          }
          labels = weeklyData.map((d, index) => `W${index + 1}`);
          revenueData = weeklyData.map(d => d.revenue / 1000000);
          spendData = weeklyData.map(d => d.spend / 1000000);
          roasData = weeklyData.map(d => d.spend ? d.revenue / d.spend : 0);
        } else {
          // 3개월 초과: 월별 집계
          const monthlyData = [];
          const monthMap = new Map();
          chartData.forEach(d => {
            const date = new Date(d.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthMap.has(monthKey)) {
              monthMap.set(monthKey, { revenue: 0, spend: 0 });
            }
            const monthData = monthMap.get(monthKey);
            monthData.revenue += d.revenue;
            const adsData = adsByDate.get(d.date);
            monthData.spend += adsData ? adsData.cost : 0;
          });
          
          monthMap.forEach((data, monthKey) => {
            monthlyData.push({
              date: monthKey,
              revenue: data.revenue,
              spend: data.spend
            });
          });
          
          // 월별 데이터를 날짜순으로 정렬
          monthlyData.sort((a, b) => a.date.localeCompare(b.date));
          
          labels = monthlyData.map(d => d.date);
          revenueData = monthlyData.map(d => d.revenue / 1000000);
          spendData = monthlyData.map(d => d.spend / 1000000);
          roasData = monthlyData.map(d => d.spend ? d.revenue / d.spend : 0);
        }
        
        console.log('RevenueSpendChart 데이터 포맷:', { 
          daysDiff, 
          labelsCount: labels.length, 
          sampleLabels: labels.slice(0, 5)
        });
        
        setData({
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
              borderWidth: 1,
              callbacks: {
                label: function(context) {
                  const label = context.dataset.label || '';
                  const value = context.parsed.y;
                  
                  if (label.includes('매출')) {
                    return `${label}: ${value.toFixed(1)}백만원`;
                  } else if (label.includes('광고비')) {
                    return `${label}: ${value.toFixed(1)}백만원`;
                  } else if (label.includes('ROAS')) {
                    return `${label}: ${value.toFixed(2)}x`;
                  }
                  return `${label}: ${value}`;
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
