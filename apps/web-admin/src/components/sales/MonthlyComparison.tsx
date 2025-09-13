'use client';

import React, { useState, useEffect } from 'react';
import { formatNumber, formatCurrency, formatPercentage } from '../../lib/format';

interface MonthlyData {
  month: string;
  revenue: number;
  quantity: number;
  orders: number;
  avgOrderValue: number;
  conversionRate: number;
  roas: number;
  totalSpend: number;
}

interface MonthlyComparisonProps {
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

export default function MonthlyComparison({ filters, refreshTrigger }: MonthlyComparisonProps) {
  const [currentMonthData, setCurrentMonthData] = useState<MonthlyData | null>(null);
  const [previousMonthData, setPreviousMonthData] = useState<MonthlyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonthlyData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 현재 월 데이터
      const currentParams = new URLSearchParams({
        from: filters.from,
        to: filters.to,
        ...(filters.region.length > 0 && { region: filters.region.join(',') }),
        ...(filters.channel.length > 0 && { channel: filters.channel.join(',') }),
        ...(filters.category.length > 0 && { category: filters.category.join(',') }),
        ...(filters.sku.length > 0 && { sku: filters.sku.join(',') }),
      });

      // 이전 월 데이터 (현재 월의 1일부터 30일 전까지)
      const currentDate = new Date(filters.from);
      const prevMonthStart = new Date(currentDate);
      prevMonthStart.setMonth(currentDate.getMonth() - 1);
      const prevMonthEnd = new Date(prevMonthStart);
      prevMonthEnd.setDate(prevMonthStart.getDate() + 29);

      const previousParams = new URLSearchParams({
        from: prevMonthStart.toISOString().split('T')[0],
        to: prevMonthEnd.toISOString().split('T')[0],
        ...(filters.region.length > 0 && { region: filters.region.join(',') }),
        ...(filters.channel.length > 0 && { channel: filters.channel.join(',') }),
        ...(filters.category.length > 0 && { category: filters.category.join(',') }),
        ...(filters.sku.length > 0 && { sku: filters.sku.join(',') }),
      });

      const [currentResponse, previousResponse] = await Promise.all([
        fetch(`/api/sales/kpi?${currentParams}`),
        fetch(`/api/sales/kpi?${previousParams}`)
      ]);

      if (!currentResponse.ok || !previousResponse.ok) {
        throw new Error('Failed to fetch monthly data');
      }

      const currentData = await currentResponse.json();
      const previousData = await previousResponse.json();

      setCurrentMonthData({
        month: '이번 달',
        revenue: currentData.totalRevenue,
        quantity: currentData.totalQuantity,
        orders: currentData.totalOrders,
        avgOrderValue: currentData.avgOrderValue,
        conversionRate: currentData.conversionRate,
        roas: currentData.roas,
        totalSpend: currentData.totalSpend,
      });

      setPreviousMonthData({
        month: '지난 달',
        revenue: previousData.totalRevenue,
        quantity: previousData.totalQuantity,
        orders: previousData.totalOrders,
        avgOrderValue: previousData.avgOrderValue,
        conversionRate: previousData.conversionRate,
        roas: previousData.roas,
        totalSpend: previousData.totalSpend,
      });

    } catch (err) {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
      console.error('Failed to fetch monthly data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthlyData();
  }, [filters, refreshTrigger]);

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3>📊 전월/이달 비교</h3>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div className="skeleton" style={{ height: '200px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !currentMonthData || !previousMonthData) {
    return (
      <div className="chart-container">
        <h3>📊 전월/이달 비교</h3>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          {error || '데이터를 불러올 수 없습니다.'}
        </div>
      </div>
    );
  }

  const ComparisonRow = ({ 
    label, 
    currentValue, 
    previousValue, 
    formatter = (v: number) => v.toString(),
    unit = ''
  }: {
    label: string;
    currentValue: number;
    previousValue: number;
    formatter?: (value: number) => string;
    unit?: string;
  }) => {
    const growth = calculateGrowth(currentValue, previousValue);
    const isPositive = growth >= 0;
    
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr 1fr 1fr', 
        gap: '16px', 
        padding: '12px 0',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ fontWeight: '500' }}>{label}</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatter(currentValue)}{unit}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>이번 달</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
            {formatter(previousValue)}{unit}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: isPositive ? '#10b981' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px'
          }}>
            <span>{isPositive ? '↗' : '↘'}</span>
            <span>{isPositive ? '+' : ''}{growth.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="chart-container">
      <h3>📊 전월/이달 비교</h3>
      
      <div style={{ 
        backgroundColor: '#1f2937', 
        borderRadius: '8px', 
        padding: '20px',
        border: '1px solid #374151'
      }}>
        {/* 헤더 */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '16px', 
          padding: '12px 0',
          borderBottom: '2px solid #4b5563',
          fontWeight: 'bold',
          color: '#9ca3af'
        }}>
          <div>지표</div>
          <div style={{ textAlign: 'center' }}>이번 달</div>
          <div style={{ textAlign: 'center' }}>지난 달</div>
        </div>

        {/* 비교 데이터 */}
        <div style={{ marginTop: '16px' }}>
          <ComparisonRow
            label="총 매출"
            currentValue={currentMonthData.revenue}
            previousValue={previousMonthData.revenue}
            formatter={formatCurrency}
          />
          <ComparisonRow
            label="총 판매수량"
            currentValue={currentMonthData.quantity}
            previousValue={previousMonthData.quantity}
            formatter={formatNumber}
            unit="개"
          />
          <ComparisonRow
            label="총 주문수"
            currentValue={currentMonthData.orders}
            previousValue={previousMonthData.orders}
            formatter={formatNumber}
            unit="건"
          />
          <ComparisonRow
            label="평균 주문금액"
            currentValue={currentMonthData.avgOrderValue}
            previousValue={previousMonthData.avgOrderValue}
            formatter={formatCurrency}
          />
          <ComparisonRow
            label="전환율"
            currentValue={currentMonthData.conversionRate}
            previousValue={previousMonthData.conversionRate}
            formatter={(v) => v.toFixed(1)}
            unit="%"
          />
          <ComparisonRow
            label="ROAS"
            currentValue={currentMonthData.roas}
            previousValue={previousMonthData.roas}
            formatter={(v) => v.toFixed(2)}
            unit="x"
          />
        </div>

        {/* 요약 통계 */}
        <div style={{ 
          marginTop: '20px', 
          padding: '16px', 
          backgroundColor: '#111827', 
          borderRadius: '6px',
          border: '1px solid #374151'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#9ca3af' }}>성장 요약</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>매출 성장</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: calculateGrowth(currentMonthData.revenue, previousMonthData.revenue) >= 0 ? '#10b981' : '#ef4444'
              }}>
                {calculateGrowth(currentMonthData.revenue, previousMonthData.revenue) >= 0 ? '+' : ''}
                {calculateGrowth(currentMonthData.revenue, previousMonthData.revenue).toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>주문 성장</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: calculateGrowth(currentMonthData.orders, previousMonthData.orders) >= 0 ? '#10b981' : '#ef4444'
              }}>
                {calculateGrowth(currentMonthData.orders, previousMonthData.orders) >= 0 ? '+' : ''}
                {calculateGrowth(currentMonthData.orders, previousMonthData.orders).toFixed(1)}%
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>ROAS 변화</div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold',
                color: calculateGrowth(currentMonthData.roas, previousMonthData.roas) >= 0 ? '#10b981' : '#ef4444'
              }}>
                {calculateGrowth(currentMonthData.roas, previousMonthData.roas) >= 0 ? '+' : ''}
                {calculateGrowth(currentMonthData.roas, previousMonthData.roas).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
