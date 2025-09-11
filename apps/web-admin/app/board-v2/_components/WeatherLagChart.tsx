'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function WeatherLagChart() {
  const { from, to } = useFilters();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 날씨와 판매량 데이터 준비
        const weatherData = calendarData
          .filter(d => d.tavg !== null && d.tavg !== undefined)
          .map(d => ({ date: d.date, temp: d.tavg, sales: d.revenue }));
        
        // 지연 상관관계 계산 (-7일 ~ +7일)
        const lags = Array.from({ length: 15 }, (_, i) => i - 7);
        const correlations = lags.map(lag => {
          const pairs = [];
          
          for (let i = 0; i < weatherData.length; i++) {
            const currentDate = new Date(weatherData[i].date);
            const targetDate = new Date(currentDate);
            targetDate.setDate(currentDate.getDate() + lag);
            
            const targetDateStr = targetDate.toISOString().split('T')[0];
            const targetWeather = weatherData.find(w => w.date === targetDateStr);
            
            if (targetWeather) {
              pairs.push({
                temp: weatherData[i].temp,
                sales: targetWeather.sales
              });
            }
          }
          
          if (pairs.length < 3) return 0;
          
          // 상관계수 계산
          const n = pairs.length;
          const sumX = pairs.reduce((sum, p) => sum + p.temp, 0);
          const sumY = pairs.reduce((sum, p) => sum + p.sales, 0);
          const sumXY = pairs.reduce((sum, p) => sum + p.temp * p.sales, 0);
          const sumX2 = pairs.reduce((sum, p) => sum + p.temp * p.temp, 0);
          const sumY2 = pairs.reduce((sum, p) => sum + p.sales * p.sales, 0);
          
          const r = (n * sumXY - sumX * sumY) / 
                   Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
          
          return isNaN(r) ? 0 : r;
        });
        
        setData({
          labels: lags.map(lag => lag === 0 ? '당일' : `${lag > 0 ? '+' : ''}${lag}일`),
          datasets: [{
            label: '상관 r',
            data: correlations,
            borderColor: '#5aa2ff',
            backgroundColor: 'rgba(90, 162, 255, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        });
      } catch (error) {
        console.error('Failed to fetch weather lag data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>날씨 지연 상관 차트 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>±7일 지연 상관관계 분석 중</div>
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
                  return `상관계수: ${context.parsed.y.toFixed(3)}`;
                }
              }
            }
          },
          scales: {
            x: {
              ticks: { color: '#9aa0a6', font: { size: 9 } },
              grid: { color: '#1b2533' }
            },
            y: {
              min: -1,
              max: 1,
              ticks: { 
                color: '#9aa0a6', 
                font: { size: 10 },
                callback: function(value) {
                  return value.toFixed(1);
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
