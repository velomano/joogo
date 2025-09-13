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

      const url = `/api/sales/kpi?${params}`;
      console.log('Fetching from URL:', url);

      const response = await fetch(url);
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error text:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Received data:', data);
      setKpiData(data);
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpiData();
  }, [filters, refreshTrigger]);

  const getStatusColor = (value: number, thresholds: { good: number; warn: number }) => {
    if (value >= thresholds.good) return 'text-green-500';
    if (value >= thresholds.warn) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGrowthStatus = (growth: number) => {
    if (growth > 5) return { color: 'text-green-500', icon: '↗️' };
    if (growth > -5) return { color: 'text-yellow-500', icon: '→' };
    return { color: 'text-red-500', icon: '↘️' };
  };

  if (isLoading) {
    return (
      <div className="chart-container">
        <h3>📊 판매 KPI 오버뷰</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 kpi-grid-layout">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-700 rounded mb-3"></div>
              <div className="h-10 bg-gray-700 rounded mb-2"></div>
              <div className="h-4 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container">
        <h3>📊 판매 KPI 오버뷰</h3>
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 text-red-400">
          <p>데이터를 불러오는 중 오류가 발생했습니다: {error}</p>
          <button 
            onClick={fetchKpiData}
            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!kpiData) {
    return (
      <div className="chart-container">
        <h3>📊 판매 KPI 오버뷰</h3>
        <div className="bg-gray-800 rounded-lg p-8 text-center text-gray-400">
          <p>KPI 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: '총 매출',
      value: formatCurrency(kpiData.totalRevenue),
      growth: kpiData.revenueGrowth,
      status: getStatusColor(kpiData.totalRevenue, { good: 100000000, warn: 50000000 }),
      icon: '💰'
    },
    {
      label: '총 판매수량',
      value: formatNumber(kpiData.totalQuantity),
      growth: kpiData.quantityGrowth,
      status: getStatusColor(kpiData.totalQuantity, { good: 10000, warn: 5000 }),
      icon: '📦'
    },
    {
      label: '총 주문수',
      value: formatNumber(kpiData.totalOrders),
      growth: kpiData.orderGrowth,
      status: getStatusColor(kpiData.totalOrders, { good: 1000, warn: 500 }),
      icon: '🛒'
    },
    {
      label: '평균 주문금액',
      value: formatCurrency(kpiData.avgOrderValue),
      growth: kpiData.aovGrowth,
      status: getStatusColor(kpiData.avgOrderValue, { good: 100000, warn: 50000 }),
      icon: '💳'
    },
    {
      label: '전환율',
      value: formatPercentage(kpiData.conversionRate, 1),
      growth: kpiData.conversionGrowth,
      status: getStatusColor(kpiData.conversionRate, { good: 3, warn: 1 }),
      icon: '🎯'
    },
    {
      label: 'ROAS',
      value: formatNumber(kpiData.roas, 2) + 'x',
      growth: kpiData.roasGrowth,
      status: getStatusColor(kpiData.roas, { good: 3, warn: 1.5 }),
      icon: '📈'
    }
  ];

  return (
    <div className="chart-container">
      <h3>📊 판매 KPI 오버뷰</h3>
      <div className="mb-4 text-sm text-gray-400">
        기간: {kpiData.period.from} ~ {kpiData.period.to} ({kpiData.period.days}일)
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 kpi-grid-layout">
        {kpiCards.map((kpi, index) => {
          const growthStatus = getGrowthStatus(kpi.growth);
          return (
            <div key={index} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl">{kpi.icon}</span>
                <span className={`text-sm font-medium ${growthStatus.color}`}>
                  {growthStatus.icon} {formatPercentage(Math.abs(kpi.growth), 1)}
                </span>
              </div>
              
              <div className="mb-3">
                <div className={`text-3xl font-bold mb-2 ${kpi.status}`}>
                  {kpi.value}
                </div>
                <div className="text-base text-gray-400 font-medium">
                  {kpi.label}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {kpi.growth > 0 ? '전월 대비 증가' : kpi.growth < 0 ? '전월 대비 감소' : '변화 없음'}
              </div>
            </div>
          );
        })}
      </div>

      {/* 추가 정보 */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <h4 className="text-xl font-semibold mb-4 text-blue-400">💰 광고 성과</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-base">총 광고비:</span>
              <span className="font-mono text-lg font-bold">{formatCurrency(kpiData.totalSpend)}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-base">ROAS:</span>
              <span className={`font-mono text-lg font-bold ${getStatusColor(kpiData.roas, { good: 3, warn: 1.5 })}`}>
                {formatNumber(kpiData.roas, 2)}x
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-colors">
          <h4 className="text-xl font-semibold mb-4 text-green-400">📊 성장 지표</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-base">매출 성장률:</span>
              <span className={`font-mono text-lg font-bold ${getGrowthStatus(kpiData.revenueGrowth).color}`}>
                {formatPercentage(Math.abs(kpiData.revenueGrowth), 1)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-base">주문 성장률:</span>
              <span className={`font-mono text-lg font-bold ${getGrowthStatus(kpiData.orderGrowth).color}`}>
                {formatPercentage(Math.abs(kpiData.orderGrowth), 1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
