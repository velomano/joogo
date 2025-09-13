'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

interface CustomerSegmentData {
  segment: string;
  name: string;
  description: string;
  customerCount: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  avgOrdersPerMonth: number;
  lifetimeValue: number;
  retentionRate: number;
  referralRate: number;
  satisfactionScore: number;
  customerShare: string;
  revenueShare: string;
  orderShare: string;
  revenuePerCustomer: number;
  ordersPerCustomer: string;
  growthPotential: string;
}

interface CustomerAnalytics {
  segments: CustomerSegmentData[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    totalOrders: number;
    avgRevenuePerCustomer: number;
    avgOrdersPerCustomer: string;
    overallRetentionRate: string;
    overallSatisfactionScore: string;
  };
  insights: {
    topPerformingSegment: string;
    growthOpportunity: string;
    retentionFocus: string;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
}

interface CustomerSegmentChartProps {
  filters: {
    from: string;
    to: string;
    region?: string;
    channel?: string;
    category?: string;
    sku?: string;
  };
}

export default function CustomerSegmentChart({ filters }: CustomerSegmentChartProps) {
  const [data, setData] = useState<CustomerAnalytics | null>(null);
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

        const response = await fetch(`/api/analytics/customers?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching customer analytics:', err);
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
          <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>고객 세그먼트 분석</h3>
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
          <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>고객 세그먼트 분석</h3>
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

  const segmentColors = {
    'vip': '#8b5cf6',
    'loyal': '#3b82f6', 
    'regular': '#10b981',
    'new': '#f59e0b'
  };

  const segmentIcons = {
    'vip': '👑',
    'loyal': '⭐',
    'regular': '👤',
    'new': '🆕'
  };

  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>고객 세그먼트 분석</h3>
      </div>

      {/* 요약 지표 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>총 고객수</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatNumber(data.summary.totalCustomers)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(data.summary.totalRevenue)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>고객당 평균 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(data.summary.avgRevenuePerCustomer)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>전체 유지율</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {data.summary.overallRetentionRate}%
          </div>
        </div>
      </div>

      {/* 인사이트 카드 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px', fontWeight: 'bold' }}>
            🏆 최고 성과 세그먼트
          </div>
          <div style={{ fontSize: '16px', color: '#92400e' }}>
            {data.insights.topPerformingSegment}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#dbeafe', borderRadius: '8px', border: '1px solid #3b82f6' }}>
          <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px', fontWeight: 'bold' }}>
            📈 성장 기회
          </div>
          <div style={{ fontSize: '16px', color: '#1e40af' }}>
            {data.insights.growthOpportunity}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fecaca', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '4px', fontWeight: 'bold' }}>
            🎯 유지율 집중 대상
          </div>
          <div style={{ fontSize: '16px', color: '#dc2626' }}>
            {data.insights.retentionFocus}
          </div>
        </div>
      </div>

      {/* 세그먼트별 상세 분석 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '16px' 
      }}>
        {data.segments.map((segment) => (
          <div 
            key={segment.segment}
            style={{ 
              padding: '20px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              backgroundColor: '#ffffff',
              position: 'relative'
            }}
          >
            {/* 세그먼트 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>
                {segmentIcons[segment.segment as keyof typeof segmentIcons]}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, marginBottom: '4px' }}>
                  {segment.name}
                </h4>
                <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                  {segment.description}
                </p>
              </div>
            </div>

            {/* 성장 잠재력 배지 */}
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px',
              padding: '4px 8px',
              backgroundColor: segment.growthPotential === 'High' ? '#dcfce7' : 
                              segment.growthPotential === 'Medium' ? '#fef3c7' : '#fecaca',
              color: segment.growthPotential === 'High' ? '#166534' : 
                     segment.growthPotential === 'Medium' ? '#92400e' : '#dc2626',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {segment.growthPotential === 'High' ? '높음' : 
               segment.growthPotential === 'Medium' ? '보통' : '낮음'}
            </div>

            {/* 매출 비율 바 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>매출 점유율</span>
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {segment.revenueShare}%
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
                    width: `${segment.revenueShare}%`, 
                    height: '100%', 
                    backgroundColor: segmentColors[segment.segment as keyof typeof segmentColors],
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* 상세 지표 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>고객수</div>
                <div style={{ fontWeight: 'bold' }}>{formatNumber(segment.customerCount)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>매출</div>
                <div style={{ fontWeight: 'bold' }}>{formatCurrency(segment.revenue)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>주문</div>
                <div style={{ fontWeight: 'bold' }}>{formatNumber(segment.orders)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>평균 주문가</div>
                <div style={{ fontWeight: 'bold' }}>{formatCurrency(segment.avgOrderValue)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>LTV</div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {formatCurrency(segment.lifetimeValue)}
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>월 주문수</div>
                <div style={{ fontWeight: 'bold' }}>{segment.avgOrdersPerMonth}회</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>유지율</div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {segment.retentionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>추천율</div>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                  {segment.referralRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>만족도</div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {segment.satisfactionScore.toFixed(1)}/5.0
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>고객당 매출</div>
                <div style={{ fontWeight: 'bold' }}>
                  {formatCurrency(segment.revenuePerCustomer)}
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
