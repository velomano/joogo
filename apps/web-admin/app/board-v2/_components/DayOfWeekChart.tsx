'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DayOfWeekChart({ 
  refreshTrigger, 
  from, 
  to 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
}) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 요일별 데이터 집계
        const dayOfWeekData = {
          '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0
        };
        const dayCounts = {
          '월': 0, '화': 0, '수': 0, '목': 0, '금': 0, '토': 0, '일': 0
        };
        
        calendarData.forEach(d => {
          const date = new Date(d.date);
          const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
          dayOfWeekData[dayOfWeek] += d.revenue;
          dayCounts[dayOfWeek]++;
        });
        
        // 평균 계산
        const labels = ['월', '화', '수', '목', '금', '토', '일'];
        const values = labels.map(day => {
          const count = dayCounts[day];
          return count > 0 ? Math.floor(dayOfWeekData[day] / count / 1000) : 0; // 천원 단위
        });
        
        setData({
          labels,
          datasets: [{
            label: '평균 일판매량 (천원)',
            data: values,
            backgroundColor: '#5aa2ff',
            borderColor: '#1b2533',
            borderWidth: 1
          }]
        });
      } catch (error) {
        console.error('Failed to fetch day of week data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [from, to, refreshTrigger]);

  if (loading) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>요일 효과 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>요일별 판매량 패턴 분석 중</div>
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
                  return `${context.label}: 평균 ${context.parsed.y}천원`;
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
                  return `${value}천원`;
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
