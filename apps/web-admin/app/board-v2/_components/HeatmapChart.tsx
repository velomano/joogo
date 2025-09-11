'use client';

import { useEffect, useState } from 'react';
import { Adapters } from '../_data/adapters';
import { useFilters } from '@/lib/lib/state/filters';

export default function HeatmapChart() {
  const { from, to } = useFilters();
  const [heatmapData, setHeatmapData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // 요일과 할인율 데이터 생성
        const daysOfWeek = ['월', '화', '수', '목', '금', '토', '일'];
        const discountBins = [0, 0.05, 0.1, 0.2, 0.3, 1.0]; // 0%, 5%, 10%, 20%, 30%, 100%
        
        // 히트맵 데이터 초기화
        const heatmap = {};
        daysOfWeek.forEach(day => {
          heatmap[day] = {};
          for (let i = 0; i < discountBins.length - 1; i++) {
            heatmap[day][i] = { sum: 0, count: 0 };
          }
        });
        
        // 데이터 집계
        calendarData.forEach(d => {
          const date = new Date(d.date);
          const dayOfWeek = daysOfWeek[date.getDay()];
          const discountRate = Math.random() * 0.3; // Mock 할인율
          const sales = d.revenue;
          
          // 할인 구간 찾기
          let binIndex = 0;
          for (let i = 0; i < discountBins.length - 1; i++) {
            if (discountRate >= discountBins[i] && discountRate < discountBins[i + 1]) {
              binIndex = i;
              break;
            }
          }
          
          if (heatmap[dayOfWeek] && heatmap[dayOfWeek][binIndex]) {
            heatmap[dayOfWeek][binIndex].sum += sales;
            heatmap[dayOfWeek][binIndex].count += 1;
          }
        });
        
        // 평균 계산 및 최대값 찾기
        let maxAvg = 0;
        const processedData = {};
        daysOfWeek.forEach(day => {
          processedData[day] = {};
          for (let i = 0; i < discountBins.length - 1; i++) {
            const avg = heatmap[day][i].count > 0 
              ? heatmap[day][i].sum / heatmap[day][i].count 
              : 0;
            processedData[day][i] = avg;
            maxAvg = Math.max(maxAvg, avg);
          }
        });
        
        setHeatmapData({
          daysOfWeek,
          discountBins,
          data: processedData,
          maxAvg
        });
      } catch (error) {
        console.error('Failed to fetch heatmap data:', error);
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
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>히트맵 로딩 중...</div>
          <div style={{ fontSize: '12px' }}>요일×할인 구간 분석 중</div>
        </div>
      </div>
    );
  }

  if (!heatmapData) {
    return (
      <div style={{ height: '130px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c1117', borderRadius: '8px', border: '1px solid #1d2835' }}>
        <div style={{ textAlign: 'center', color: '#e25b5b' }}>
          <div style={{ fontSize: '14px', marginBottom: '8px' }}>데이터 로드 실패</div>
          <div style={{ fontSize: '12px' }}>히트맵을 표시할 수 없습니다</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '130px', overflow: 'auto', borderRadius: '10px', border: '1px solid #1b2533' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', textAlign: 'left' }}>
              요일 \ 할인
            </th>
            {heatmapData.discountBins.slice(0, -1).map((_, i) => (
              <th key={i} style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', textAlign: 'center', fontSize: '10px' }}>
                {Math.round(heatmapData.discountBins[i] * 100)}~{Math.round(heatmapData.discountBins[i + 1] * 100)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {heatmapData.daysOfWeek.map(day => (
            <tr key={day}>
              <td style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', fontWeight: '600' }}>
                {day}
              </td>
              {heatmapData.discountBins.slice(0, -1).map((_, binIndex) => {
                const avg = heatmapData.data[day][binIndex];
                const alpha = heatmapData.maxAvg > 0 ? Math.max(0.05, avg / heatmapData.maxAvg) : 0;
                
                return (
                  <td key={binIndex} style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', textAlign: 'center' }}>
                    <div
                      style={{
                        height: '20px',
                        borderRadius: '4px',
                        background: `rgba(90, 162, 255, ${alpha})`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: alpha > 0.5 ? '#ffffff' : '#9aa0a6',
                        fontSize: '10px',
                        fontWeight: '600'
                      }}
                      title={`평균판매≈ ${(avg / 1000).toFixed(0)}천원`}
                    >
                      {avg > 0 ? Math.round(avg / 1000) : ''}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
