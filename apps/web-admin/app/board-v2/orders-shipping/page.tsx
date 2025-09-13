'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for better performance
const OrdersKpiOverview = dynamic(() => import('../../../src/components/orders/OrdersKpiOverview'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>주문 KPI 로딩 중...</div>
});

const ShippingKpiOverview = dynamic(() => import('../../../src/components/orders/ShippingKpiOverview'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>배송 KPI 로딩 중...</div>
});

const OrderStatusChart = dynamic(() => import('../../../src/components/orders/OrderStatusChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>주문 상태 차트 로딩 중...</div>
});

const ShippingStatusChart = dynamic(() => import('../../../src/components/orders/ShippingStatusChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>배송 상태 차트 로딩 중...</div>
});

const OrderTimelineChart = dynamic(() => import('../../../src/components/orders/OrderTimelineChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>주문 타임라인 로딩 중...</div>
});

const RegionalShippingChart = dynamic(() => import('../../../src/components/orders/RegionalShippingChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>지역별 배송 로딩 중...</div>
});

const OrderProcessingChart = dynamic(() => import('../../../src/components/orders/OrderProcessingChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>주문 처리 분석 로딩 중...</div>
});

export default function OrdersShippingAnalysisPage() {
  console.log('OrdersShippingAnalysisPage 렌더링됨');

  // 오늘 기준 한 달 전부터 오늘까지
  const getDefaultDateRange = () => {
    const today = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    
    return {
      from: oneMonthAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  };

  const [filters, setFilters] = useState({
    ...getDefaultDateRange(),
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      ...getDefaultDateRange(),
    });
  };

  return (
    <div className="wrap">
      <aside className="sidebar panel">
        <h1>주문/배송 분석 <span className="muted">v2</span></h1>
        
        <div className="row" style={{ margin: '8px 0' }}>
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
            style={{ marginRight: '8px' }}
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <button 
          className="btn" 
          onClick={handleRefresh}
          style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white',
            width: '100%',
            marginBottom: '8px'
          }}
        >
          🔄 데이터 새로고침
        </button>
        
        <button 
          className="btn" 
          onClick={resetFilters}
          style={{ 
            backgroundColor: '#6b7280', 
            color: 'white',
            width: '100%'
          }}
        >
          초기화
        </button>
      </aside>

      <main className="main">
        <div className="grid">
          {/* 주문 현황 KPI */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📋 주문 현황</h3>
            <OrdersKpiOverview 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 배송 현황 KPI */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🚚 배송 현황</h3>
            <ShippingKpiOverview 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 주문 상태별 분석 */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📊 주문 상태별 분석</h3>
            <OrderStatusChart 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 배송 상태별 분석 */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🚛 배송 상태별 분석</h3>
            <ShippingStatusChart 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 주문 처리 타임라인 */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>⏱️ 주문 처리 타임라인</h3>
            <OrderTimelineChart 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 지역별 배송 현황 */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🗺️ 지역별 배송 현황</h3>
            <RegionalShippingChart 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>

          {/* 주문 처리 시간 분석 */}
          <div className="panel">
            <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>⚡ 주문 처리 시간 분석</h3>
            <OrderProcessingChart 
              from={filters.from}
              to={filters.to}
              region={[]}
              channel={[]}
              category={[]}
              sku={[]}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
