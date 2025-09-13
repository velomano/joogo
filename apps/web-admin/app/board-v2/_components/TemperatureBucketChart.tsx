'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TemperatureBucketChart({ 
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
        console.log('🌡️ TemperatureBucketChart: 실제 DB 데이터 조회 시작');
        
        const [calendarData, weatherData] = await Promise.all([
          Adapters.calendarHeatmap({ from, to }, {}),
          Adapters.weatherData({ from, to }, 'SEOUL') // 서울 기준
        ]);
        
        console.log('🌡️ TemperatureBucketChart: DB 데이터 조회 완료', { 
          calendar: calendarData.length, 
          weather: weatherData.length 
        });
        
        // 날짜별로 매칭하여 온도와 매출 데이터 결합
        const weatherMap = new Map(weatherData.map(w => [w.date, w.temperature || w.tavg])); // temperature 또는 tavg 사용
        
        // 미래 데이터 필터링 - 현재 날짜까지만 표시
        const today = new Date().toISOString().slice(0, 10);
        const filteredCalendarData = calendarData.filter(d => d.date <= today);
        
        const tempData = filteredCalendarData
          .map(d => {
            const tavg = weatherMap.get(d.date);
            return { temp: tavg, sales: d.revenue, date: d.date };
          })
          .filter(d => d.temp !== null && d.temp !== undefined && d.temp > -10 && d.temp < 40);
        
        console.log('🌡️ TemperatureBucketChart: 버킷 데이터 생성 완료', tempData.length, '개');
        
        // 데이터가 없으면 빈 차트 표시
        if (tempData.length === 0) {
          console.log('🌡️ TemperatureBucketChart: 버킷 데이터가 없습니다');
          setData({
            labels: [],
            datasets: []
          });
          return;
        }
        
        // 온도 범위 계산
        const minTemp = Math.min(...tempData.map(d => d.temp));
        const maxTemp = Math.max(...tempData.map(d => d.temp));
        const bucketCount = 8;
        const bucketWidth = (maxTemp - minTemp) / bucketCount;
        
        // 버킷별 데이터 집계
        const buckets = Array.from({ length: bucketCount }, (_, i) => {
          const bucketMin = minTemp + i * bucketWidth;
          const bucketMax = minTemp + (i + 1) * bucketWidth;
          const bucketData = tempData.filter(d => d.temp >= bucketMin && d.temp < bucketMax);
          
          const avgSales = bucketData.length > 0 
            ? bucketData.reduce((sum, d) => sum + d.sales, 0) / bucketData.length
            : 0;
          
          return {
            label: `${bucketMin.toFixed(1)}~${bucketMax.toFixed(1)}`,
            avgSales: avgSales / 1000, // 천원 단위
            count: bucketData.length
          };
        });
        
        setData({
          labels: buckets.map(b => b.label),
          datasets: [{
            label: '평균 판매 (천원)',
            data: buckets.map(b => b.avgSales),
            backgroundColor: buckets.map((_, i) => {
              // 온도가 높을수록 더 진한 파란색
              const intensity = i / (bucketCount - 1);
              return `rgba(90, 162, 255, ${0.3 + intensity * 0.7})`;
            }),
            borderColor: '#5aa2ff',
            borderWidth: 1
          }]
        });
      } catch (error) {
        console.error('Failed to fetch temperature bucket data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>데이터 없음</div>
        </div>
      </div>
    );
  }

  if (!data || (data.labels && data.labels.length === 0)) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#9aa0a6' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 없음</div>
          <div style={{ fontSize: '12px' }}>기온과 매출 데이터가 없습니다</div>
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
                  return `평균 판매: ${context.parsed.y.toFixed(0)}천원`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 9 },
                maxRotation: 45
              },
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
