'use client';

import React, { useState } from 'react';
import SalesKpiOverview from '../../../src/components/sales/SalesKpiOverview';
import DailyTrendChart from '../../../src/components/sales/DailyTrendChart';

export default function SalesAnalysisPage() {
  console.log('SalesAnalysisPage 렌더링됨');

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
    region: [],
    channel: [],
    category: [],
    sku: [],
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      ...getDefaultDateRange(),
      region: [],
      channel: [],
      category: [],
      sku: [],
    });
  };

  return (
    <div className="wrap">
      <main className="main">
        <section className="panel">
          <div style={{ display: 'grid', gap: '20px' }}>
            <h1>판매 분석 페이지</h1>
            
            {/* 판매 KPI 오버뷰 */}
            <SalesKpiOverview 
              key={`kpi-${refreshTrigger}-${Date.now()}`}
              filters={filters} 
              refreshTrigger={refreshTrigger} 
            />

            {/* 간단한 필터 섹션 */}
            <div className="chart-container">
              <h3>필터</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                  type="date"
                  value={filters.from}
                  onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
                  className="input"
                />
                <input
                  type="date"
                  value={filters.to}
                  onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
                  className="input"
                />
                <button onClick={handleRefresh} className="btn">
                  새로고침
                </button>
                <button onClick={resetFilters} className="btn">
                  초기화
                </button>
              </div>
            </div>

            {/* 일별 추이 + 시즌성 */}
            <DailyTrendChart 
              filters={filters} 
              refreshTrigger={refreshTrigger} 
            />

            <div className="chart-container">
              <h3>📺 채널 성과/ROAS</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                채널별 매출, ROAS, 전환율 비교 (구현 예정)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}