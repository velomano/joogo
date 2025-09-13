'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency } from '../../lib/format';

interface DailyTrendData {
  date: string;
  revenue: number;
  quantity: number;
  orders: number;
  avgOrderValue: number;
  conversionRate: number;
}

interface DailyTrendChartProps {
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

export default function DailyTrendChart({ filters, refreshTrigger }: DailyTrendChartProps) {
  const [data, setData] = useState<DailyTrendData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'quantity' | 'orders'>('revenue');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock 데이터 생성
      const fromDate = new Date(filters.from);
      const toDate = new Date(filters.to);
      const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const mockData: DailyTrendData[] = [];
      
      for (let i = 0; i < days; i++) {
        const currentDate = new Date(fromDate);
        currentDate.setDate(fromDate.getDate() + i);
        
        // 시즌성 패턴 (주말에 높은 매출, 월요일에 낮은 매출)
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isMonday = dayOfWeek === 1;
        
        let baseMultiplier = 1;
        if (isWeekend) baseMultiplier = 1.3;
        else if (isMonday) baseMultiplier = 0.7;
        
        // 랜덤 변동 추가
        const randomFactor = 0.8 + Math.random() * 0.4;
        
        const revenue = Math.round(2000000 * baseMultiplier * randomFactor);
        const quantity = Math.round(40 * baseMultiplier * randomFactor);
        const orders = Math.round(8 * baseMultiplier * randomFactor);
        const avgOrderValue = Math.round(revenue / orders);
        const conversionRate = 2.5 + Math.random() * 1.5;
        
        mockData.push({
          date: currentDate.toISOString().split('T')[0],
          revenue,
          quantity,
          orders,
          avgOrderValue,
          conversionRate
        });
      }
      
      setData(mockData);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('DailyTrendChart error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters, refreshTrigger]);

  const getMetricValue = (item: DailyTrendData) => {
    switch (selectedMetric) {
      case 'revenue': return item.revenue;
      case 'quantity': return item.quantity;
      case 'orders': return item.orders;
      default: return item.revenue;
    }
  };

  const getMetricLabel = () => {
    switch (selectedMetric) {
      case 'revenue': return '매출 (원)';
      case 'quantity': return '판매수량 (개)';
      case 'orders': return '주문수 (건)';
      default: return '매출 (원)';
    }
  };

  const getMetricFormatter = () => {
    switch (selectedMetric) {
      case 'revenue': return formatCurrency;
      case 'quantity': return formatNumber;
      case 'orders': return formatNumber;
      default: return formatCurrency;
    }
  };

  const maxValue = Math.max(...data.map(getMetricValue));
  const minValue = Math.min(...data.map(getMetricValue));

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3>📈 일별 추이 + 시즌성</h3>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '200px', marginBottom: '20px' }}></div>
          <div className="skeleton" style={{ height: '20px', width: '60%', margin: '0 auto' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3>📈 일별 추이 + 시즌성</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3>📈 일별 추이 + 시즌성</h3>
      
      {/* 메트릭 선택 */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button
            className={`btn ${selectedMetric === 'revenue' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('revenue')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            매출
          </button>
          <button
            className={`btn ${selectedMetric === 'quantity' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('quantity')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            판매수량
          </button>
          <button
            className={`btn ${selectedMetric === 'orders' ? 'active' : ''}`}
            onClick={() => setSelectedMetric('orders')}
            style={{ fontSize: '14px', padding: '8px 16px' }}
          >
            주문수
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
            const value = getMetricValue(item);
            const height = ((value - minValue) / (maxValue - minValue)) * 200;
            const isWeekend = new Date(item.date).getDay() === 0 || new Date(item.date).getDay() === 6;
            
            return (
              <div
                key={item.date}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1 1 0',
                  minWidth: '20px',
                  maxWidth: '30px',
                  width: 'auto',
                  boxSizing: 'border-box'
                }}
              >
                <div
                  style={{
                    height: `${height}px`,
                    backgroundColor: isWeekend ? '#10b981' : '#3b82f6',
                    width: '100%',
                    borderRadius: '2px 2px 0 0',
                    minHeight: '2px',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                  title={`${item.date}: ${getMetricFormatter()(value)}`}
                />
                <div style={{ 
                  fontSize: '10px', 
                  color: '#9ca3af', 
                  marginTop: '5px',
                  transform: 'rotate(-45deg)',
                  whiteSpace: 'nowrap',
                  display: index % Math.ceil(data.length / 10) === 0 ? 'block' : 'none'
                }}>
                  {new Date(item.date).getDate()}
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
          {getMetricLabel()}
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
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>최고값</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {getMetricFormatter()(maxValue)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>최저값</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {getMetricFormatter()(minValue)}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균값</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {getMetricFormatter()(Math.round(data.reduce((sum, item) => sum + getMetricValue(item), 0) / data.length))}
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>주말 평균</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
            {getMetricFormatter()(Math.round(
              data
                .filter(item => {
                  const day = new Date(item.date).getDay();
                  return day === 0 || day === 6;
                })
                .reduce((sum, item) => sum + getMetricValue(item), 0) / 
              data.filter(item => {
                const day = new Date(item.date).getDay();
                return day === 0 || day === 6;
              }).length
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
