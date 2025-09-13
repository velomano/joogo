'use client';

import React, { useState, useEffect } from 'react';

interface RegionalData {
  region: string;
  revenue: number;
  orders: number;
  customers: number;
  avgOrderValue: number;
  growthRate: number;
  marketShare: number;
}

interface RegionalAnalytics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    topRegion: string;
    growthRate: number;
  };
  regions: RegionalData[];
  insights: {
    topPerformer: string;
    growthLeader: string;
    marketOpportunity: string;
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('ko-KR').format(value);
};

export default function RegionalAnalysisChart({ filters }: { filters: any }) {
  const [data, setData] = useState<RegionalAnalytics | null>(null);
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

        const response = await fetch(`/api/analytics/regional?${params}`);
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
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
          <span style={{ fontSize: '20px', marginRight: '8px' }}>🗺️</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>지역별 매출 분석</h3>
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
          <span style={{ fontSize: '20px', marginRight: '8px' }}>🗺️</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>지역별 매출 분석</h3>
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

  const regionIcons = {
    '서울': '🏙️',
    '부산': '🌊',
    '대구': '🏔️',
    '인천': '✈️',
    '광주': '💡',
    '대전': '🔬',
    '울산': '🏭',
    '경기': '🏘️',
    '강원': '⛰️',
    '충북': '🍎',
    '충남': '🌾',
    '전북': '🌾',
    '전남': '🌊',
    '경북': '🏔️',
    '경남': '🌊',
    '제주': '🏝️'
  };

  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px', marginRight: '8px' }}>🗺️</span>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>지역별 매출 분석</h3>
      </div>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        지역별 매출 성과를 분석하여 지역 특성에 맞는 마케팅 전략을 수립할 수 있습니다.
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
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>총 고객</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(data.summary.totalCustomers)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db', marginBottom: '4px', fontWeight: '500' }}>평균 주문가</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatCurrency(data.summary.avgOrderValue)}
          </div>
        </div>
      </div>

      {/* 지역별 상세 분석 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px' 
      }}>
        {data.regions.map((region) => (
          <div 
            key={region.region}
            style={{ 
              padding: '20px', 
              border: '1px solid #374151', 
              borderRadius: '12px',
              backgroundColor: '#1f2937',
              position: 'relative'
            }}
          >
            {/* 지역 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '24px', marginRight: '12px' }}>
                {regionIcons[region.region as keyof typeof regionIcons] || '📍'}
              </div>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, marginBottom: '4px', color: '#ffffff' }}>
                  {region.region}
                </h4>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  시장 점유율 {region.marketShare.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* 성장률 배지 */}
            <div style={{ 
              position: 'absolute', 
              top: '16px', 
              right: '16px',
              padding: '4px 8px',
              backgroundColor: region.growthRate >= 0 ? '#10b981' : '#ef4444',
              color: 'white',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              {region.growthRate >= 0 ? '+' : ''}{region.growthRate.toFixed(1)}%
            </div>

            {/* 지역 지표 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>매출</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(region.revenue)}</div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>주문</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatNumber(region.orders)}</div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>고객</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatNumber(region.customers)}</div>
              </div>
              <div>
                <div style={{ color: '#d1d5db', marginBottom: '2px', fontWeight: '500' }}>평균 주문가</div>
                <div style={{ fontWeight: 'bold', color: '#ffffff' }}>{formatCurrency(region.avgOrderValue)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 인사이트 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px', 
        marginTop: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#10b981', borderRadius: '8px', border: '1px solid #059669' }}>
          <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px', fontWeight: 'bold' }}>
            🏆 최고 성과 지역
          </div>
          <div style={{ fontSize: '16px', color: '#ffffff' }}>
            {data.insights.topPerformer}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#3b82f6', borderRadius: '8px', border: '1px solid #2563eb' }}>
          <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px', fontWeight: 'bold' }}>
            📈 성장 리더
          </div>
          <div style={{ fontSize: '16px', color: '#ffffff' }}>
            {data.insights.growthLeader}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f59e0b', borderRadius: '8px', border: '1px solid #d97706' }}>
          <div style={{ fontSize: '14px', color: '#ffffff', marginBottom: '4px', fontWeight: 'bold' }}>
            💡 기회 지역
          </div>
          <div style={{ fontSize: '16px', color: '#ffffff' }}>
            {data.insights.marketOpportunity}
          </div>
        </div>
      </div>
    </div>
  );
}
