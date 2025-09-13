'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency } from '../../lib/format';

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

interface SalesKpiCardsProps {
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

interface KpiCardProps {
  title: string;
  value: string;
  subValue?: string;
  growth?: number;
  icon: string;
  color?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ 
  title, 
  value, 
  subValue, 
  growth, 
  icon, 
  color = '#3b82f6' 
}) => {
  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '120px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <h4 style={{ fontSize: '14px', color: '#9ca3af', margin: 0 }}>{title}</h4>
        <span style={{ fontSize: '20px' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '24px', fontWeight: 'bold', color: color, marginBottom: '8px' }}>
        {value}
      </div>
      {subValue && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>
          {subValue}
        </div>
      )}
      {growth !== undefined && (
        <div style={{ 
          fontSize: '12px', 
          color: growth >= 0 ? '#10b981' : '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span>{growth >= 0 ? '↗' : '↘'}</span>
          <span>{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</span>
          <span style={{ color: '#6b7280' }}>(전월 대비)</span>
        </div>
      )}
    </div>
  );
};

export default function SalesKpiCards({ filters, refreshTrigger }: SalesKpiCardsProps) {
  const [data, setData] = useState<SalesKpiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKpiData = async () => {
    try {
      setIsLoading(true);
      setError(null);

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
      setData(result);
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="chart-container">
            <div className="skeleton" style={{ height: '120px' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="chart-container">
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          {error || '데이터를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      <KpiCard
        title="총 매출"
        value={formatCurrency(data.totalRevenue)}
        growth={data.revenueGrowth}
        icon="💰"
        color="#10b981"
      />
      
      <KpiCard
        title="총 판매수량"
        value={formatNumber(data.totalQuantity) + '개'}
        growth={data.quantityGrowth}
        icon="📦"
        color="#3b82f6"
      />
      
      <KpiCard
        title="총 주문수"
        value={formatNumber(data.totalOrders) + '건'}
        growth={data.orderGrowth}
        icon="🛒"
        color="#8b5cf6"
      />
      
      <KpiCard
        title="평균 주문금액"
        value={formatCurrency(data.avgOrderValue)}
        growth={data.aovGrowth}
        icon="💳"
        color="#f59e0b"
      />

      <KpiCard
        title="ROAS"
        value={data.roas.toFixed(2) + 'x'}
        subValue={`광고비 ${formatCurrency(data.totalSpend)}원`}
        growth={data.roasGrowth}
        icon="📈"
        color="#ef4444"
      />
      
      <KpiCard
        title="전환율"
        value={data.conversionRate.toFixed(1) + '%'}
        growth={data.conversionGrowth}
        icon="🎯"
        color="#06b6d4"
      />

      <KpiCard
        title="매출 성장률"
        value={`${data.revenueGrowth >= 0 ? '+' : ''}${data.revenueGrowth.toFixed(1)}%`}
        subValue="전월 대비"
        icon="📊"
        color={data.revenueGrowth >= 0 ? '#10b981' : '#ef4444'}
      />
      
      <KpiCard
        title="주문 성장률"
        value={`${data.orderGrowth >= 0 ? '+' : ''}${data.orderGrowth.toFixed(1)}%`}
        subValue="전월 대비"
        icon="📈"
        color={data.orderGrowth >= 0 ? '#10b981' : '#ef4444'}
      />
    </div>
  );
}
