'use client';

import React, { useState } from 'react';
import SalesKpiOverview from '../../../src/components/sales/SalesKpiOverview';
import DailyTrendChart from '../../../src/components/sales/DailyTrendChart';
import MonthlyComparison from '../../../src/components/sales/MonthlyComparison';
import TimeGranularity from '../../../src/components/sales/TimeGranularity';

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
            style={{ flex: 1 }} 
            title="시작 날짜" 
            value={filters.from} 
            onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
          />
          <input 
            type="date" 
            style={{ flex: 1 }} 
            title="종료 날짜" 
            value={filters.to} 
            onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
          />
        </div>

        <hr className="line" />
        <label className="muted">지역</label>
        <div className="row">
          <select style={{ flex: 1 }} multiple>
            <option>전체</option>
            <option>서울</option>
            <option>경기</option>
            <option>인천</option>
            <option>부산</option>
          </select>
        </div>

        <hr className="line" />
        <label className="muted">채널</label>
        <div className="row">
          <select style={{ flex: 1 }} multiple>
            <option>전체</option>
            <option>온라인</option>
            <option>오프라인</option>
            <option>모바일</option>
          </select>
        </div>

        <hr className="line" />
        <label className="muted">카테고리</label>
        <div className="row">
          <select style={{ flex: 1 }} multiple>
            <option>전체</option>
            <option>의류</option>
            <option>신발</option>
            <option>액세서리</option>
          </select>
        </div>

        <hr className="line" />
        <label className="muted">SKU</label>
        <div className="row">
          <select style={{ flex: 1 }} multiple>
            <option>전체</option>
            <option>SKU-001</option>
            <option>SKU-002</option>
            <option>SKU-003</option>
          </select>
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

        <div className="chart-container">
          <h3>📺 채널 성과/ROAS</h3>
          <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
            채널별 매출, ROAS, 전환율 비교 (구현 예정)
          </div>
        </div>
      </main>
    </div>
  );
}