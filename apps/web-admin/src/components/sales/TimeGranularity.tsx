'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency } from '../../lib/format';

interface TimeData {
  period: string;
  revenue: number;
  quantity: number;
  orders: number;
  avgOrderValue: number;
}

interface TimeGranularityProps {
  filters: {
    from: string;
    to: string;
    region: string[];
    channel: string[];
    category: string[];
    sku: string[];
  };
  refreshTrigger: number;
}

export default function TimeGranularity({ filters, refreshTrigger }: TimeGranularityProps) {
  const [data, setData] = useState<TimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'hourly'>('daily');

  const fetchTimeData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock 데이터 생성
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      let mockData: TimeData[] = [];
      
      if (granularity === 'daily') {
        // 일별 데이터
        for (let i = 0; i < days; i++) {
          const currentDate = new Date(fromDate);
          currentDate.setDate(fromDate.getDate() + i);
          
          const dayOfWeek = currentDate.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const baseMultiplier = isWeekend ? 1.3 : 1;
          const randomFactor = 0.8 + Math.random() * 0.4;
          
          const revenue = Math.round(2000000 * baseMultiplier * randomFactor);
          const quantity = Math.round(40 * baseMultiplier * randomFactor);
          const orders = Math.round(8 * baseMultiplier * randomFactor);
          
          mockData.push({
            period: currentDate.toISOString().split('T')[0],
            revenue,
            quantity,
            orders,
            avgOrderValue: Math.round(revenue / orders)
          });
        }
      } else if (granularity === 'weekly') {
        // 주별 데이터
        const weeks = Math.ceil(days / 7);
        for (let i = 0; i < weeks; i++) {
          const weekStart = new Date(fromDate);
          weekStart.setDate(fromDate.getDate() + (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          const revenue = Math.round(14000000 * (0.9 + Math.random() * 0.2));
          const quantity = Math.round(280 * (0.9 + Math.random() * 0.2));
          const orders = Math.round(56 * (0.9 + Math.random() * 0.2));
          
          mockData.push({
            period: `${weekStart.toISOString().split('T')[0]} ~ ${weekEnd.toISOString().split('T')[0]}`,
            revenue,
            quantity,
            orders,
            avgOrderValue: Math.round(revenue / orders)
          });
        }
      } else if (granularity === 'hourly') {
        // 시간대별 데이터 (하루 기준)
        const hours = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
        
        hours.forEach((hour, index) => {
          // 업무시간(9-18시)에 높은 매출, 새벽시간에 낮은 매출
          let baseMultiplier = 1;
          if (index >= 9 && index <= 18) baseMultiplier = 1.5;
          else if (index >= 19 && index <= 22) baseMultiplier = 1.2;
          else if (index >= 0 && index <= 6) baseMultiplier = 0.3;
          
          const randomFactor = 0.7 + Math.random() * 0.6;
          const revenue = Math.round(100000 * baseMultiplier * randomFactor);
          const quantity = Math.round(2 * baseMultiplier * randomFactor);
          const orders = Math.round(0.4 * baseMultiplier * randomFactor);
          
          mockData.push({
            period: hour,
            revenue,
            quantity,
            orders,
            avgOrderValue: orders > 0 ? Math.round(revenue / orders) : 0
          });
        });
      }
      
      setData(mockData);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('TimeGranularity error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeData();
  }, [filters, refreshTrigger, granularity]);

  const getMaxValue = (key: keyof TimeData) => {
    if (key === 'period') return 0;
    return Math.max(...data.map(item => item[key] as number));
  };

  const getMinValue = (key: keyof TimeData) => {
    if (key === 'period') return 0;
    return Math.min(...data.map(item => item[key] as number));
  };

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3>⏰ 시간별 세분화 분석</h3>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '200px' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3>⏰ 시간별 세분화 분석</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>⏰ 시간별 세분화 분석</h3>
      
      {/* 세분화 선택 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className={`btn ${granularity === 'daily' ? 'active' : ''}`}
            onClick={() => setGranularity('daily')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            일별
          </button>
          <button
            className={`btn ${granularity === 'weekly' ? 'active' : ''}`}
            onClick={() => setGranularity('weekly')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            주별
          </button>
          <button
            className={`btn ${granularity === 'hourly' ? 'active' : ''}`}
            onClick={() => setGranularity('hourly')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            시간대별
          </button>
        </div>
      </div>

      {/* 차트 영역 */}
      <div style={{ 
        height: '300px', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        backgroundColor: '#1f2937',
        position: 'relative',
        overflowX: 'auto'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'end', 
          height: '100%', 
          gap: data.length > 30 ? '1px' : '2px',
          minWidth: data.length > 30 ? `${data.length * 8}px` : '100%',
          width: data.length > 30 ? `${data.length * 8}px` : '100%',
          justifyContent: data.length > 30 ? 'flex-start' : 'space-between'
        }}>
          {data.map((item, index) => {
            const maxRevenue = getMaxValue('revenue');
            const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 200 : 0;
            
            return (
              <div
                key={item.period}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: data.length > 30 ? '6px' : '100%',
                  flex: data.length > 30 ? 'none' : 1,
                  minWidth: data.length > 30 ? '6px' : '20px',
                  cursor: 'pointer'
                }}
                title={`${item.period}: ${formatCurrency(item.revenue)}`}
              >
                <div
                  style={{
                    height: `${height}px`,
                    backgroundColor: '#3b82f6',
                    width: '100%',
                    borderRadius: '2px 2px 0 0',
                    minHeight: '2px',
                    position: 'relative'
                  }}
                />
                <div style={{ 
                  fontSize: data.length > 30 ? '8px' : '10px', 
                  color: '#9ca3af', 
                  marginTop: '5px',
                  transform: data.length > 30 ? 'none' : (granularity === 'hourly' ? 'rotate(-45deg)' : 'none'),
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  display: data.length > 30 ? (index % Math.ceil(data.length / 10) === 0 ? 'block' : 'none') : 'block'
                }}>
                  {data.length > 30 ? 
                    (index % Math.ceil(data.length / 10) === 0 ? 
                      (granularity === 'daily' ? new Date(item.period).getDate() : 
                       granularity === 'weekly' ? `W${index + 1}` :
                       item.period.split(':')[0]) : '') :
                    (granularity === 'daily' ? new Date(item.period).getDate() : 
                     granularity === 'weekly' ? `W${index + 1}` :
                     item.period.split(':')[0])
                  }
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Y축 라벨 */}
        <div style={{ 
          position: 'absolute', 
          left: '10px', 
          top: '20px', 
          fontSize: '12px', 
          color: '#9ca3af' 
        }}>
          매출 (원)
        </div>
      </div>

      {/* 통계 요약 */}
      <div style={{ 
        marginTop: '20px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
        gap: '15px' 
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 매출</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 매출</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatCurrency(data.reduce((sum, item) => sum + item.revenue, 0) / data.length)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>최고 매출</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
            {formatCurrency(getMaxValue('revenue'))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 주문수</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatNumber(data.reduce((sum, item) => sum + item.orders, 0))}건
          </div>
        </div>
      </div>
    </div>
  );
}
