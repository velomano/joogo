'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CategoryPieChart({ 
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
        const chartData = await Adapters.treemapPareto({ from, to }, { region, channel, category, sku });
        
        // 오늘 데이터만 표시하도록 필터링
        const today = new Date().toISOString().slice(0, 10);
        let filteredData = chartData;
        if (from === today && to === today) {
          filteredData = chartData.filter(item => item.date === today);
          if (filteredData.length === 0) {
            // 오늘 데이터가 없으면 빈 차트 표시
            setData({
              labels: [],
              datasets: []
            });
            setLoading(false);
            return;
          }
        }
        
        // 카테고리별 매출 집계
        const categoryMap = new Map<string, number>();
        filteredData.forEach(item => {
          const category = item.category || '기타';
          categoryMap.set(category, (categoryMap.get(category) || 0) + item.revenue);
        });
        
        const labels = Array.from(categoryMap.keys());
        const values = Array.from(categoryMap.values());
        const total = values.reduce((sum, val) => sum + val, 0);
        
        setData({
          labels,
          datasets: [{
            data: values,
            backgroundColor: [
              '#5aa2ff',
              '#2aa775',
              '#e0a400',
              '#e25b5b',
              '#9aa0a6',
              '#5aa2ff'
            ],
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
  }, [from, to, region, channel, category, sku, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>파이차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>카테고리별 매출 데이터 분석 중</div>
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
      <Pie
        data={data}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom' as const,
              labels: {
                color: '#e7edf5',
                font: { size: 10 },
                padding: 15
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
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ₩${(value / 1000000).toFixed(1)}M (${percentage}%)`;
                }
              }
            }
          }
        }}
      />
    </div>
  );
}
