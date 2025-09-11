'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function TemperatureScatterChart({ 
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
  const [correlation, setCorrelation] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [calendarData, weatherData] = await Promise.all([
          Adapters.calendarHeatmap({ from, to }, {}),
          Adapters.weather({ from, to }, { region: 'SEOUL' }) // 서울 기준
        ]);
        
        // 날짜별로 매칭하여 온도와 매출 데이터 결합
        const weatherMap = new Map(weatherData.map(w => [w.date, w.tavg]));
        
        const scatterData = calendarData
          .map(d => {
            const tavg = weatherMap.get(d.date);
            return {
              x: tavg,
              y: Math.floor(d.revenue / 10000), // 만원 단위로 변환
              date: d.date
            };
          })
          .filter(d => d.x !== null && d.x !== undefined && d.x > -10 && d.x < 40);
        
        console.log('Temperature scatter data:', scatterData.slice(0, 5)); // 디버깅용
        
        if (scatterData.length === 0) {
          setData(null);
          return;
        }
        
        // 상관관계 계산
        const n = scatterData.length;
        const sumX = scatterData.reduce((sum, d) => sum + d.x, 0);
        const sumY = scatterData.reduce((sum, d) => sum + d.y, 0);
        const sumXY = scatterData.reduce((sum, d) => sum + d.x * d.y, 0);
        const sumX2 = scatterData.reduce((sum, d) => sum + d.x * d.x, 0);
        const sumY2 = scatterData.reduce((sum, d) => sum + d.y * d.y, 0);
        
        const r = (n * sumXY - sumX * sumY) / 
                 Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        // 회귀선 계산
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        const minX = Math.min(...scatterData.map(d => d.x));
        const maxX = Math.max(...scatterData.map(d => d.x));
        
        setCorrelation({
          r: r.toFixed(2),
          strength: Math.abs(r) < 0.2 ? '미약' : 
                   Math.abs(r) < 0.4 ? '약함' : 
                   Math.abs(r) < 0.6 ? '보통' : 
                   Math.abs(r) < 0.8 ? '강함' : '매우 강함',
          slope: slope.toFixed(2),
          regressionLine: [
            { x: minX, y: slope * minX + intercept },
            { x: maxX, y: slope * maxX + intercept }
          ]
        });
        
        setData({
          datasets: [
            {
              label: '일자 점',
              data: scatterData,
              backgroundColor: '#5aa2ff',
              borderColor: '#5aa2ff',
              pointRadius: 4,
              pointHoverRadius: 6
            },
            {
              label: '회귀선',
              data: [
                { x: minX, y: slope * minX + intercept },
                { x: maxX, y: slope * maxX + intercept }
              ],
              type: 'line',
              borderColor: '#e25b5b',
              backgroundColor: 'transparent',
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 2
            }
          ]
        });
      } catch (error) {
        console.error('Failed to fetch temperature scatter data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>산점도 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>온도와 판매량 상관관계 분석 중</div>
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
    <>
      <div style={{ height: '130px' }}>
        <Scatter
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
                title: {
                  display: true,
                  text: '평균기온(°C)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                ticks: { color: '#9aa0a6', font: { size: 10 } },
                grid: { color: '#1b2533' }
              },
              y: {
                title: {
                  display: true,
                  text: '판매량(만원)',
                  color: '#e7edf5',
                  font: { size: 12 }
                },
                beginAtZero: true,
                ticks: { 
                  color: '#9aa0a6', 
                  font: { size: 10 },
                  callback: function(value) {
                    return `${value}만원`;
                  }
                },
                grid: { color: '#1b2533' }
              }
            }
          }}
        />
      </div>
      {correlation && (
        <div className="note" style={{ marginTop: '8px', fontSize: '11px' }}>
          해석: r≈{correlation.r}({correlation.strength}). 1℃↑ 시 판매량 {correlation.slope} 변동(선형).
          <br />
          <span style={{ color: '#9aa0a6' }}>
            데이터: 기상청 API + Mock API
          </span>
        </div>
      )}
    </>
  );
}
