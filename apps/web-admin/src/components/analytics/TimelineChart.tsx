'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';

interface TimelineData {
  timestamp: string;
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  avgOrderValue: number;
  hour?: number;
  date?: string;
  dayOfWeek?: string;
  month?: number;
  year?: number;
  isPeakHour?: boolean;
  isWeekend?: boolean;
  isWeekday?: boolean;
  isHolidayMonth?: boolean;
}

interface TimelineAnalytics {
  data: TimelineData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalVisitors: number;
    avgRevenue: number;
    avgOrders: number;
    avgVisitors: number;
    avgConversionRate: string;
    peakRevenue: number;
    peakOrders: number;
    peakVisitors: number;
  };
  insights: {
    bestPerformingTime: TimelineData;
    worstPerformingTime: TimelineData;
    trend: string;
  };
  period: {
    from: string;
    to: string;
    days: number;
    granularity: string;
  };
}

interface TimelineChartProps {
  filters: {
    from: string;
    to: string;
    region?: string;
    channel?: string;
    category?: string;
    sku?: string;
  };
  granularity?: 'hour' | 'day' | 'week' | 'month';
}

export default function TimelineChart({ filters, granularity = 'day' }: TimelineChartProps) {
  const [data, setData] = useState<TimelineAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGranularity, setSelectedGranularity] = useState(granularity);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
          granularity: selectedGranularity,
        });

        const response = await fetch(`/api/analytics/timeline?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching timeline analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters, selectedGranularity]);

  if (loading) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>시간대별 트렌드 분석</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div style={{ color: '#6b7280' }}>데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>시간대별 트렌드 분석</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
            <div>데이터 로딩 실패: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const granularityOptions = [
    { value: 'hour', label: '시간별' },
    { value: 'day', label: '일별' },
    { value: 'week', label: '주별' },
    { value: 'month', label: '월별' }
  ];

  // 차트 데이터 준비
  const maxRevenue = Math.max(...data.data.map(d => d.revenue));
  const maxOrders = Math.max(...data.data.map(d => d.orders));
  const maxVisitors = Math.max(...data.data.map(d => d.visitors));

  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>시간대별 트렌드 분석</h3>
        </div>
        
        {/* 세분화 옵션 */}
        <select 
          value={selectedGranularity} 
          onChange={(e) => setSelectedGranularity(e.target.value as any)}
          style={{
            padding: '8px 12px',
            border: '1px solid #374151',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#1f2937',
            color: '#ffffff'
          }}
        >
          {granularityOptions.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {/* 요약 지표 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatCurrency(data.summary.totalRevenue)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>총 주문</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(data.summary.totalOrders)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>총 방문자</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(data.summary.totalVisitors)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>평균 전환율</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.summary.avgConversionRate}%
          </div>
        </div>
      </div>

      {/* 트렌드 인사이트 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#dcfce7', borderRadius: '8px', border: '1px solid #10b981' }}>
          <div style={{ fontSize: '14px', color: '#166534', marginBottom: '4px', fontWeight: 'bold' }}>
            🏆 최고 성과 시간
          </div>
          <div style={{ fontSize: '16px', color: '#166534' }}>
            {data.insights.bestPerformingTime.timestamp}
          </div>
          <div style={{ fontSize: '12px', color: '#166534', marginTop: '4px' }}>
            매출: {formatCurrency(data.insights.bestPerformingTime.revenue)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fecaca', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '4px', fontWeight: 'bold' }}>
            📉 최저 성과 시간
          </div>
          <div style={{ fontSize: '16px', color: '#dc2626' }}>
            {data.insights.worstPerformingTime.timestamp}
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px' }}>
            매출: {formatCurrency(data.insights.worstPerformingTime.revenue)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: data.insights.trend === 'up' ? '#dcfce7' : data.insights.trend === 'down' ? '#fecaca' : '#f3f4f6', borderRadius: '8px', border: `1px solid ${data.insights.trend === 'up' ? '#10b981' : data.insights.trend === 'down' ? '#ef4444' : '#6b7280'}` }}>
          <div style={{ fontSize: '14px', color: data.insights.trend === 'up' ? '#166534' : data.insights.trend === 'down' ? '#dc2626' : '#6b7280', marginBottom: '4px', fontWeight: 'bold' }}>
            {data.insights.trend === 'up' ? '📈' : data.insights.trend === 'down' ? '📉' : '➡️'} 트렌드
          </div>
          <div style={{ fontSize: '16px', color: data.insights.trend === 'up' ? '#166534' : data.insights.trend === 'down' ? '#dc2626' : '#6b7280' }}>
            {data.insights.trend === 'up' ? '상승' : data.insights.trend === 'down' ? '하락' : '안정'}
          </div>
        </div>
      </div>

      {/* 차트 영역 */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '12px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#ffffff' }}>
          {selectedGranularity === 'hour' ? '시간별' : 
           selectedGranularity === 'day' ? '일별' : 
           selectedGranularity === 'week' ? '주별' : '월별'} 매출 트렌드
        </h4>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 16px 0' }}>
          {selectedGranularity === 'hour' ? '시간대별 매출 패턴을 확인하여 피크 시간대를 파악할 수 있습니다.' :
           selectedGranularity === 'day' ? '일별 매출 추이를 통해 주간 패턴과 특별한 이벤트의 영향을 분석할 수 있습니다.' :
           selectedGranularity === 'week' ? '주별 매출 트렌드를 통해 계절성과 장기적인 성장 패턴을 파악할 수 있습니다.' :
           '월별 매출 데이터로 계절적 변동과 연간 성장률을 분석할 수 있습니다.'}
        </p>
        
        {/* 간단한 바 차트 */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'end', 
          gap: '4px', 
          height: '200px',
          overflowX: 'auto',
          padding: '10px 0'
        }}>
          {data.data.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              minWidth: selectedGranularity === 'hour' ? '40px' : '60px'
            }}>
              <div style={{ 
                width: selectedGranularity === 'hour' ? '30px' : '50px',
                height: `${(item.revenue / maxRevenue) * 150}px`,
                backgroundColor: item.isPeakHour || item.isWeekend || item.isHolidayMonth ? '#3b82f6' : '#10b981',
                borderRadius: '4px 4px 0 0',
                marginBottom: '8px',
                transition: 'all 0.3s ease'
              }} />
              <div style={{ 
                fontSize: '10px', 
                color: '#9ca3af', 
                textAlign: 'center',
                transform: selectedGranularity === 'hour' ? 'rotate(-45deg)' : 'none',
                whiteSpace: 'nowrap'
              }}>
                {selectedGranularity === 'hour' ? item.timestamp : 
                 selectedGranularity === 'day' ? item.timestamp.split('-').slice(1).join('/') :
                 selectedGranularity === 'week' ? `${index + 1}주차` :
                 item.timestamp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 상세 데이터 테이블 */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '12px', 
        padding: '20px',
        maxHeight: '400px',
        overflowY: 'auto'
      }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#ffffff' }}>상세 데이터</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: selectedGranularity === 'hour' ? 
            '80px 1fr 1fr 1fr 1fr 1fr' : 
            '120px 1fr 1fr 1fr 1fr 1fr',
          gap: '12px',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#d1d5db',
          borderBottom: '1px solid #374151',
          paddingBottom: '8px',
          marginBottom: '8px'
        }}>
          <div>시간</div>
          <div>매출</div>
          <div>주문</div>
          <div>방문자</div>
          <div>전환율</div>
          <div>평균 주문가</div>
        </div>
        {data.data.slice(0, 20).map((item, index) => (
          <div key={index} style={{ 
            display: 'grid', 
            gridTemplateColumns: selectedGranularity === 'hour' ? 
              '80px 1fr 1fr 1fr 1fr 1fr' : 
              '120px 1fr 1fr 1fr 1fr 1fr',
            gap: '12px',
            fontSize: '12px',
            padding: '8px 0',
            borderBottom: index < 19 ? '1px solid #374151' : 'none',
            backgroundColor: item.isPeakHour || item.isWeekend || item.isHolidayMonth ? '#374151' : 'transparent',
            color: '#ffffff'
          }}>
            <div style={{ fontWeight: 'bold' }}>{item.timestamp}</div>
            <div>{formatCurrency(item.revenue)}</div>
            <div>{formatNumber(item.orders)}</div>
            <div>{formatNumber(item.visitors)}</div>
            <div>{item.conversionRate.toFixed(1)}%</div>
            <div>{formatCurrency(item.avgOrderValue)}</div>
          </div>
        ))}
      </div>

      {/* 기간 정보 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        분석 기간: {data.period.from} ~ {data.period.to} ({data.period.days}일) | 
        세분화: {granularityOptions.find(opt => opt.value === selectedGranularity)?.label}
      </div>
    </div>
  );
}
