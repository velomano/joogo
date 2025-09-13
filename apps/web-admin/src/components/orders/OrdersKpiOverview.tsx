'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency, formatPercentage } from '../../lib/format';

interface OrdersKpiData {
  // 주문 현황
  totalOrders: number;
  newOrders: number;
  cancelledOrders: number;
  completedOrders: number;
  pendingOrders: number;
  
  // 주문 처리
  avgOrderProcessingTime: number;
  orderCompletionRate: number;
  orderCancellationRate: number;
  
  // 성장률
  orderGrowth: number;
  completionRateGrowth: number;
  cancellationRateGrowth: number;
  
  // 기간 정보
  period: {
    from: string;
    to: string;
    days: number;
  };
  comparisonLabel: string;
}

interface OrdersKpiOverviewProps {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  refreshTrigger: number;
}

export default function OrdersKpiOverview({ 
  from, 
  to, 
  region, 
  channel, 
  category, 
  sku, 
  refreshTrigger 
}: OrdersKpiOverviewProps) {
  const [kpiData, setKpiData] = useState<OrdersKpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching Orders KPI data with filters:', { from, to, region, channel, category, sku });

      const params = new URLSearchParams({
        from,
        to,
        ...(region && region.length > 0 && { region: region.join(',') }),
        ...(channel && channel.length > 0 && { channel: channel.join(',') }),
        ...(category && category.length > 0 && { category: category.join(',') }),
        ...(sku && sku.length > 0 && { sku: sku.join(',') }),
      });

      const response = await fetch(`/api/orders/kpi?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders KPI data');
      }

      const result = await response.json();
      setKpiData(result);
    } catch (err) {
      console.error('Error fetching orders KPI data:', err);
      setError('주문 KPI 데이터를 불러오는 중 오류가 발생했습니다.');
      setKpiData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, [from, to, region, channel, category, sku, refreshTrigger]);

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        주문 KPI 데이터를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        {error}
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        데이터 없음
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#1f2937', 
      border: '1px solid #374151', 
      borderRadius: '8px', 
      padding: '20px'
    }}>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {/* 총 주문수 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>📋</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>총 주문수</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '4px' }}>
            {formatNumber(kpiData.totalOrders)}건
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: kpiData.orderGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <span>{kpiData.orderGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.orderGrowth >= 0 ? '+' : ''}{kpiData.orderGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        {/* 신규 주문수 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>🆕</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>신규 주문수</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            {formatNumber(kpiData.newOrders)}건
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            신규 고객 주문
          </div>
        </div>

        {/* 주문 완료율 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>✅</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>주문 완료율</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            {kpiData.orderCompletionRate.toFixed(1)}%
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: kpiData.completionRateGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <span>{kpiData.completionRateGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.completionRateGrowth >= 0 ? '+' : ''}{kpiData.completionRateGrowth.toFixed(1)}%p</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        {/* 주문 취소율 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>❌</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>주문 취소율</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
            {kpiData.orderCancellationRate.toFixed(1)}%
          </div>
          <div style={{ 
            fontSize: '10px', 
            color: kpiData.cancellationRateGrowth >= 0 ? '#ef4444' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <span>{kpiData.cancellationRateGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.cancellationRateGrowth >= 0 ? '+' : ''}{kpiData.cancellationRateGrowth.toFixed(1)}%p</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        {/* 미처리 주문수 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>⏳</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>미처리 주문수</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>
            {formatNumber(kpiData.pendingOrders)}건
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            처리 대기 중
          </div>
        </div>

        {/* 평균 처리 시간 */}
        <div className="chart-container" style={{ padding: '16px', minHeight: '100px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px', marginRight: '6px' }}>⚡</span>
            <h4 style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>평균 처리 시간</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '4px' }}>
            {kpiData.avgOrderProcessingTime.toFixed(1)}시간
          </div>
          <div style={{ fontSize: '10px', color: '#6b7280' }}>
            주문 접수부터 완료까지
          </div>
        </div>
      </div>

      {/* 기간 정보 */}
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        backgroundColor: '#111827',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#9ca3af',
        textAlign: 'center'
      }}>
        분석 기간: {kpiData.period.from} ~ {kpiData.period.to} ({kpiData.period.days}일)
      </div>
    </div>
  );
}
