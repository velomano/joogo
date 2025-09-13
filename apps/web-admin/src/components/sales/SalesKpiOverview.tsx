'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency, formatPercentage } from '../../lib/format';

interface SalesKpiData {
  totalRevenue: number;
  totalQuantity: number;
  totalOrders: number;
  avgOrderValue: number;
  conversionRate: number;
  roas: number;
  totalSpend: number;
  revenueGrowth: number;
  quantityGrowth: number;
  orderGrowth: number;
  aovGrowth: number;
  conversionGrowth: number;
  roasGrowth: number;
  // 추가 지표들
  dailyAvgRevenue: number;
  dailyAvgOrders: number;
  dailyAvgQuantity: number;
  peakRevenueDay: string;
  peakRevenueAmount: number;
  lowestRevenueDay: string;
  lowestRevenueAmount: number;
  // Joogo 시스템 아키텍처 기반 실제 지표
  // Analytics 섹션 (Financials dailyvisits) 기반
  dailyVisitors: number;
  pageViews: number;
  newVisitors: number;
  bounceRate: number;
  
  // Salesreport 섹션 (Financials dailysales/monthlysales) 기반
  dailySales: number;
  monthlySales: number;
  hourlySales: number;
  productSales: number;
  salesVolume: number;
  
  // Order 섹션 기반 지표
  orderCompletionRate: number;
  orderCancellationRate: number;
  orderRefundRate: number;
  avgOrderProcessingTime: number;
  pendingOrders: number; // 미발송 주문수
  
  // Customer 섹션 (buyer history) 기반
  repeatOrderRate: number;
  newCustomerRate: number;
  avgOrdersPerCustomer: number;
  
  // Product 섹션 기반
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  avgItemsPerOrder: number;
  
  // 수익성 지표
  netRevenue: number;
  revenuePerOrder: number;
  highValueOrderRate: number;
  period: {
    from: string;
    to: string;
    days: number;
  };
  comparisonLabel: string;
}

interface SalesKpiOverviewProps {
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

export default function SalesKpiOverview({ filters, refreshTrigger }: SalesKpiOverviewProps) {
  const [kpiData, setKpiData] = useState<SalesKpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Fetching KPI data with filters:', filters);

      const params = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        ...(filters.region && filters.region.length > 0 && { region: filters.region.join(',') }),
        ...(filters.channel && filters.channel.length > 0 && { channel: filters.channel.join(',') }),
        ...(filters.category && filters.category.length > 0 && { category: filters.category.join(',') }),
        ...(filters.sku && filters.sku.length > 0 && { sku: filters.sku.join(',') }),
      });

      const response = await fetch(`/api/sales/kpi?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log('KPI data received:', result);
      setKpiData(result);
    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to fetch KPI data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, [filters, refreshTrigger]);

  if (isLoading) {
    return (
      <div>
        <h3>📊 판매 KPI 오버뷰</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px' 
        }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className="chart-container">
              <div className="skeleton" style={{ height: '120px' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3>📊 판매 KPI 오버뷰</h3>
        <div className="chart-container">
          <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div>
        <h3>📊 판매 KPI 오버뷰</h3>
        <div className="chart-container">
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            KPI 데이터가 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3>📊 판매 KPI 오버뷰</h3>
      
      <div style={{ marginBottom: '20px', color: '#9ca3af', fontSize: '14px' }}>
        기간: {kpiData.period.from} ~ {kpiData.period.to} ({kpiData.period.days}일)
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px'
      }}>
        {/* 개별 KPI 카드들 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💰</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>총 매출</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatCurrency(kpiData.totalRevenue)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.revenueGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.revenueGrowth >= 0 ? '+' : ''}{kpiData.revenueGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📦</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>총 판매수량</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {formatNumber(kpiData.totalQuantity)}개
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.quantityGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.quantityGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.quantityGrowth >= 0 ? '+' : ''}{kpiData.quantityGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🛒</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>총 주문수</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
            {formatNumber(kpiData.totalOrders)}건
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.orderGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.orderGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.orderGrowth >= 0 ? '+' : ''}{kpiData.orderGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💳</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>평균 주문금액</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {formatCurrency(kpiData.avgOrderValue)}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.aovGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.aovGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.aovGrowth >= 0 ? '+' : ''}{kpiData.aovGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🎯</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>전환율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', marginBottom: '8px' }}>
            {kpiData.conversionRate.toFixed(1)}%
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.conversionGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.conversionGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.conversionGrowth >= 0 ? '+' : ''}{kpiData.conversionGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>ROAS</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {kpiData.roas.toFixed(2)}x
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            광고비 {formatCurrency(kpiData.totalSpend)}원
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: kpiData.roasGrowth >= 0 ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span>{kpiData.roasGrowth >= 0 ? '↗' : '↘'}</span>
            <span>{kpiData.roasGrowth >= 0 ? '+' : ''}{kpiData.roasGrowth.toFixed(1)}%</span>
            <span style={{ color: '#6b7280' }}>({kpiData.comparisonLabel})</span>
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>매출 성장률</h4>
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: kpiData.revenueGrowth >= 0 ? '#10b981' : '#ef4444',
            marginBottom: '8px'
          }}>
            {kpiData.revenueGrowth >= 0 ? '+' : ''}{kpiData.revenueGrowth.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            전월 대비
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>주문 성장률</h4>
          </div>
          <div style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            color: kpiData.orderGrowth >= 0 ? '#10b981' : '#ef4444',
            marginBottom: '8px'
          }}>
            {kpiData.orderGrowth >= 0 ? '+' : ''}{kpiData.orderGrowth.toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            전월 대비
          </div>
        </div>

        {/* 일일 평균 지표들 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📅</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>일일 평균 매출</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatCurrency(kpiData.dailyAvgRevenue || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            일일 평균
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>일일 평균 주문</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {formatNumber(kpiData.dailyAvgOrders || 0)}건
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            일일 평균
          </div>
        </div>

        {/* 고객 관련 지표들 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🔄</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>재구매율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            고객 재구매 비율
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>신규 고객율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            신규 고객 비율
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💎</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>고객 생애 가치</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {formatCurrency(kpiData.totalRevenue || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            CLV (Customer Lifetime Value)
          </div>
        </div>

        {/* 장바구니 및 반품 관련 지표들 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🛒</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>장바구니 이탈률</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            장바구니 이탈 비율
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>↩️</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>반품률</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            반품 비율
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💰</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>환불률</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            환불 비율
          </div>
        </div>

        {/* 수익성 지표들 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💵</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>순매출</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatCurrency(kpiData.netRevenue || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            반품/환불 제외
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>총 마진율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            총 마진 비율
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>⚙️</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>운영 마진율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#06b6d4', marginBottom: '8px' }}>
            {(kpiData.newCustomerRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            운영 마진 비율
          </div>
        </div>

        {/* Joogo 시스템 아키텍처 기반 지표들 */}
        
        {/* Analytics 섹션 - 방문자 지표 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>👥</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>일일 방문자</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {formatNumber(kpiData.dailyVisitors || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Financials dailyvisits
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📊</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>페이지 뷰</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatNumber(kpiData.pageViews || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Analytics 섹션
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🆕</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>신규 방문자</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {formatNumber(kpiData.newVisitors || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Analytics 섹션
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>이탈률</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {(kpiData.bounceRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Analytics 섹션
          </div>
        </div>

        {/* Salesreport 섹션 - 매출 지표 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>💰</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>일일 평균 매출</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatCurrency(kpiData.dailySales || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Financials dailysales
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>⏰</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>시간당 매출</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {formatCurrency(kpiData.hourlySales || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Reports hourlysales
          </div>
        </div>

        {/* Order 섹션 - 주문 지표 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>✅</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>주문 완료율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {(kpiData.orderCompletionRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Order 섹션
          </div>
        </div>

        {/* Customer 섹션 - 고객 지표 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🔄</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>재주문율</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {(kpiData.repeatOrderRate || 0).toFixed(1)}%
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Customer buyer history
          </div>
        </div>

        {/* 미발송 주문수 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📦</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>미발송 주문수</h4>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {formatNumber(kpiData.pendingOrders || 0)}건
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            Order 섹션
          </div>
        </div>

        {/* 최고/최저 매출일 */}
        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📈</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>최고 매출일</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981', marginBottom: '4px' }}>
            {kpiData.peakRevenueDay || 'N/A'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {formatCurrency(kpiData.peakRevenueAmount || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            최고 매출 기록
          </div>
        </div>

        <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>📉</span>
            <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>최저 매출일</h4>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444', marginBottom: '4px' }}>
            {kpiData.lowestRevenueDay || 'N/A'}
          </div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', marginBottom: '8px' }}>
            {formatCurrency(kpiData.lowestRevenueAmount || 0)}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
            최저 매출 기록
          </div>
        </div>
      </div>
    </div>
  );
}