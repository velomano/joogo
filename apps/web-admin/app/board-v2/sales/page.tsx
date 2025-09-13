'use client';

import React, { useState } from 'react';
import SalesKpiOverview from '../../../src/components/sales/SalesKpiOverview';
import DailyTrendChart from '../../../src/components/sales/DailyTrendChart';
import MonthlyComparison from '../../../src/components/sales/MonthlyComparison';
import TimeGranularity from '../../../src/components/sales/TimeGranularity';
import ChannelPerformanceChart from '../../../src/components/analytics/ChannelPerformanceChart';
import ProductAnalysisChart from '../../../src/components/analytics/ProductAnalysisChart';
import CustomerSegmentChart from '../../../src/components/analytics/CustomerSegmentChart';
import TimelineChart from '../../../src/components/analytics/TimelineChart';
import RegionalAnalysisChart from '../../../src/components/analytics/RegionalAnalysisChart';
import PriceRangeChart from '../../../src/components/analytics/PriceRangeChart';

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
        <h1>판매 분석 <span className="muted">v2</span></h1>
        
        <div className="row" style={{ margin: '8px 0' }}>
          <button className="btn" onClick={handleRefresh} style={{ 
            backgroundColor: '#6b7280', 
            color: 'white',
            width: '100%'
          }}>새로고침</button>
        </div>

        <div className="row" style={{ margin: '8px 0' }}>
          <button className="btn" onClick={resetFilters} style={{ 
            backgroundColor: '#ef4444', 
            color: 'white',
            width: '100%'
          }}>초기화</button>
        </div>

        <hr className="line" />
        <label className="muted">기간</label>
        <div className="row">
          <input 
            type="date" 
            id="fromDate" 
            style={{ flex: 1 }} 
            title="시작 날짜" 
            value={filters.from} 
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
          />
          <input 
            type="date" 
            id="toDate" 
            style={{ flex: 1 }} 
            title="종료 날짜" 
            value={filters.to} 
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>
        
        {/* 기간별 선택 버튼 */}
        <div style={{ marginBottom: '12px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>빠른 선택</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { value: 'today', label: '오늘' },
              { value: '1week', label: '1주일' },
              { value: '1month', label: '1개월' },
              { value: '3months', label: '3개월' },
              { value: '6months', label: '6개월' },
              { value: '1year', label: '1년' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  const today = new Date();
                  let fromDate = new Date();
                  
                  switch(option.value) {
                    case 'today':
                      fromDate = new Date(today);
                      break;
                    case '1week':
                      fromDate.setDate(today.getDate() - 7);
                      break;
                    case '1month':
                      fromDate.setMonth(today.getMonth() - 1);
                      break;
                    case '3months':
                      fromDate.setMonth(today.getMonth() - 3);
                      break;
                    case '6months':
                      fromDate.setMonth(today.getMonth() - 6);
                      break;
                    case '1year':
                      fromDate.setFullYear(today.getFullYear() - 1);
                      break;
                  }
                  
                  setFilters(prev => ({
                    ...prev,
                    from: fromDate.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                  }));
                }}
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px',
                  backgroundColor: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  margin: '2px'
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        {/* 판매 KPI 오버뷰 */}
        <SalesKpiOverview 
          key={`kpi-${refreshTrigger}-${Date.now()}`}
          filters={filters} 
          refreshTrigger={refreshTrigger} 
        />

        {/* 전월/이달 비교 */}
        <MonthlyComparison 
          filters={filters} 
          refreshTrigger={refreshTrigger} 
        />

        {/* 시간별 세분화 분석 */}
        <TimeGranularity 
          filters={filters} 
          refreshTrigger={refreshTrigger} 
        />

        {/* 일별 추이 + 시즌성 */}
        <DailyTrendChart 
          filters={filters} 
          refreshTrigger={refreshTrigger} 
        />

        {/* 채널별 성과 분석 */}
        <ChannelPerformanceChart 
          filters={filters} 
        />

        {/* 상품별 분석 */}
        <ProductAnalysisChart 
          filters={filters} 
        />

        {/* 고객 세그먼트 분석 */}
        <CustomerSegmentChart 
          filters={filters} 
        />

        {/* 시간대별 트렌드 분석 */}
        <TimelineChart 
          filters={filters} 
        />

        {/* 지역별 매출 분석 */}
        <RegionalAnalysisChart 
          filters={filters} 
        />

        {/* 가격대별 분석 */}
        <PriceRangeChart 
          filters={filters} 
        />
      </main>
    </div>
  );
}