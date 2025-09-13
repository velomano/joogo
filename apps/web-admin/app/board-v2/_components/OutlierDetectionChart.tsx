'use client';

import { useEffect, useState } from 'react';
import { Adapters } from '../_data/adapters';
// import { useFilters } from '@/lib/state/filters'; // 제거

export default function OutlierDetectionChart({ 
  refreshTrigger, 
  from, 
  to 
}: { 
  refreshTrigger: number;
  from: string;
  to: string;
}) {
  const [outliers, setOutliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const calendarData = await Adapters.calendarHeatmap({ from, to }, {});
        
        // Z-score 계산을 위한 통계량
        const revenues = calendarData.map(d => d.revenue);
        const quantities = calendarData.map(d => Math.floor(d.revenue / 50000)); // Mock 수량
        
        const meanRev = revenues.reduce((sum, val) => sum + val, 0) / revenues.length;
        const stdRev = Math.sqrt(revenues.reduce((sum, val) => sum + Math.pow(val - meanRev, 2), 0) / revenues.length);
        
        const meanQty = quantities.reduce((sum, val) => sum + val, 0) / quantities.length;
        const stdQty = Math.sqrt(quantities.reduce((sum, val) => sum + Math.pow(val - meanQty, 2), 0) / quantities.length);
        
        // 이상치 탐지 (Z-score >= 2)
        const outlierList: any[] = [];
        calendarData.forEach((d, index) => {
          const qty = Math.floor(d.revenue / 50000);
          const zRev = (d.revenue - meanRev) / stdRev;
          const zQty = (qty - meanQty) / stdQty;
          
          if (Math.abs(zRev) >= 2 || Math.abs(zQty) >= 2) {
            outlierList.push({
              date: d.date,
              qty_z: zQty.toFixed(2),
              rev_z: zRev.toFixed(2)
            });
          }
        });
        
        // Z-score 순으로 정렬 (절댓값 기준)
        outlierList.sort((a, b) => 
          Math.abs(parseFloat(b.qty_z)) - Math.abs(parseFloat(a.qty_z))
        );
        
        setOutliers(outlierList.slice(0, 10)); // 상위 10개만 표시
      } catch (error) {
        console.error('Failed to fetch outlier data:', error);
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

  return (
    <div style={{ height: '130px', overflow: 'auto', borderRadius: '10px', border: '1px solid #1b2533' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', textAlign: 'left' }}>
              date
            </th>
            <th style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', textAlign: 'center' }}>
              qty_z
            </th>
            <th style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#c5cbd3', textAlign: 'center' }}>
              rev_z
            </th>
          </tr>
        </thead>
        <tbody>
          {outliers.length === 0 ? (
            <tr>
              <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#9aa0a6' }}>
                이상치가 발견되지 않았습니다
              </td>
            </tr>
          ) : (
            outliers.map((outlier, index) => (
              <tr key={index}>
                <td style={{ padding: '6px 8px', borderBottom: '1px solid #212c3b', color: '#e7edf5' }}>
                  {outlier.date}
                </td>
                <td style={{ 
                  padding: '6px 8px', 
                  borderBottom: '1px solid #212c3b', 
                  textAlign: 'center',
                  color: Math.abs(parseFloat(outlier.qty_z)) >= 3 ? '#e25b5b' : '#e0a400'
                }}>
                  {outlier.qty_z}
                </td>
                <td style={{ 
                  padding: '6px 8px', 
                  borderBottom: '1px solid #212c3b', 
                  textAlign: 'center',
                  color: Math.abs(parseFloat(outlier.rev_z)) >= 3 ? '#e25b5b' : '#e0a400'
                }}>
                  {outlier.rev_z}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
