'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

interface ChannelData {
  channel: string;
  name: string;
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  avgOrderValue: number;
  roas: number;
  spend: number;
  revenueShare: string;
  orderShare: string;
  visitorShare: string;
  efficiency: string;
}

interface ChannelAnalytics {
  channels: ChannelData[];
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalVisitors: number;
    avgConversionRate: string;
    avgRoas: string;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
}

interface ChannelPerformanceChartProps {
  filters: {
    from: string;
    to: string;
    region?: string;
    channel?: string;
    category?: string;
    sku?: string;
  };
}

export default function ChannelPerformanceChart({ filters }: ChannelPerformanceChartProps) {
  const [data, setData] = useState<ChannelAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
        });

        const response = await fetch(`/api/analytics/channels?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching channel analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>채널별 성과 분석</h3>
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
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>채널별 성과 분석</h3>
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

  if (!data || !data.summary) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>채널별 성과 분석</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center', color: '#9ca3af' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>📊</div>
            <div>데이터 없음</div>
          </div>
        </div>
      </div>
    );
  }

  const channelColors = {
    web: '#3b82f6',
    mobile: '#10b981', 
    kiosk: '#f59e0b',
    social: '#ef4444'
  };

  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>채널별 성과 분석</h3>
      </div>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        각 판매 채널의 성과를 비교하여 가장 효과적인 마케팅 채널을 파악할 수 있습니다.
      </p>

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
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>평균 전환율</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.summary.avgConversionRate}%
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>평균 ROAS</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.summary.avgRoas}
          </div>
        </div>
      </div>

      {/* 채널별 상세 분석 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {data.channels.map((channel) => (
          <div 
            key={channel.channel}
            style={{ 
              padding: '20px', 
              border: '1px solid #374151', 
              borderRadius: '12px',
              backgroundColor: '#1f2937'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div 
                style={{ 
                  width: '12px', 
                  height: '12px', 
                  borderRadius: '50%', 
                  backgroundColor: channelColors[channel.channel as keyof typeof channelColors],
                  marginRight: '8px' 
                }}
              />
              <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
                {channel.name}
              </h4>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#d1d5db', fontWeight: '500' }}>매출</span>
                <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                  {formatCurrency(channel.revenue)}
                </span>
              </div>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{ 
                    width: `${channel.revenueShare}%`, 
                    height: '100%', 
                    backgroundColor: channelColors[channel.channel as keyof typeof channelColors],
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                {channel.revenueShare}% 점유율
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>주문</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatNumber(channel.orders)}</div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>방문자</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatNumber(channel.visitors)}</div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>전환율</div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {channel.conversionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>ROAS</div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {channel.roas.toFixed(1)}
                </div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>평균 주문가</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>
                  {formatCurrency(channel.avgOrderValue)}
                </div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>효율성</div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {channel.efficiency}
                </div>
              </div>
            </div>
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
        분석 기간: {data.period.from} ~ {data.period.to} ({data.period.days}일)
      </div>
    </div>
  );
}
