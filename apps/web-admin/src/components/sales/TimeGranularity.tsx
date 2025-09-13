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

      // 데이터가 없으므로 빈 배열 설정
      setData([]);
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

  if (data.length === 0) {
    return (
      <div className="chart-container">
        <h3>⏰ 시간별 세분화 분석</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>
          <div>데이터 없음</div>
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
        overflowX: 'auto',
        width: '100%',
        maxWidth: '100%',
        minWidth: '0',
        boxSizing: 'border-box'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'end', 
          height: '100%', 
          gap: '2px',
          width: '100%',
          maxWidth: '100%',
          minWidth: '100%',
          boxSizing: 'border-box',
          justifyContent: 'space-between',
          flexWrap: 'nowrap'
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
                  flex: '1 1 0',
                  minWidth: '20px',
                  maxWidth: '30px',
                  width: 'auto',
                  boxSizing: 'border-box',
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
                  fontSize: '10px', 
                  color: '#9ca3af', 
                  marginTop: '5px',
                  transform: granularity === 'hourly' ? 'rotate(-45deg)' : 'none',
                  whiteSpace: 'nowrap',
                  textAlign: 'center',
                  display: index % Math.ceil(data.length / 10) === 0 ? 'block' : 'none'
                }}>
                  {granularity === 'daily' ? new Date(item.period).getDate() : 
                   granularity === 'weekly' ? `W${index + 1}` :
                   item.period.split(':')[0]}
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
