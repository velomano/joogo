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
  period: {
    from: string;
    to: string;
    days: number;
  };
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
        ...(filters.region.length > 0 && { region: filters.region.join(',') }),
        ...(filters.channel.length > 0 && { channel: filters.channel.join(',') }),
        ...(filters.category.length > 0 && { category: filters.category.join(',') }),
        ...(filters.sku.length > 0 && { sku: filters.sku.join(',') }),
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
          {Array.from({ length: 8 }).map((_, i) => (
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
            <span style={{ color: '#6b7280' }}>(전월 대비)</span>
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
      </div>
    </div>
  );
}