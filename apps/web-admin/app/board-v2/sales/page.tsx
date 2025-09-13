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
        <label className="muted" style={{ marginTop: '6px' }}>지역</label>
        <select 
          id="regionSel" 
          title="지역별 필터"
          value={filters.region.length > 0 ? filters.region[0] : ''}
          onChange={(e) => {
            const value = e.target.value;
            setFilters(prev => ({ ...prev, region: value ? [value] : [] }));
          }}
        >
          <option value="">전체</option>
          <option>SEOUL</option>
          <option>BUSAN</option>
          <option>INCHEON</option>
          <option>DAEGU</option>
          <option>GWANGJU</option>
          <option>DAEJEON</option>
          <option>ULSAN</option>
          <option>GYEONGGI</option>
          <option>GANGWON</option>
          <option>CHUNGBUK</option>
          <option>CHUNGNAM</option>
          <option>JEONBUK</option>
          <option>JEONNAM</option>
          <option>GYEONGBUK</option>
          <option>GYEONGNAM</option>
          <option>JEJU</option>
        </select>
        <label className="muted" style={{ marginTop: '6px' }}>채널</label>
        <select 
          id="channelSel" 
          title="채널 필터"
          value={filters.channel.length > 0 ? filters.channel[0] : ''}
          onChange={(e) => {
            const value = e.target.value;
            setFilters(prev => ({ ...prev, channel: value ? [value] : [] }));
          }}
        >
          <option value="">전체</option>
          <option>ONLINE</option>
          <option>OFFLINE</option>
          <option>MOBILE</option>
        </select>
        <label className="muted" style={{ marginTop: '6px' }}>카테고리</label>
        <select 
          id="categorySel" 
          title="카테고리 필터"
          value={filters.category.length > 0 ? filters.category[0] : ''}
          onChange={(e) => {
            const value = e.target.value;
            setFilters(prev => ({ ...prev, category: value ? [value] : [] }));
          }}
        >
          <option value="">전체</option>
          <option>CLOTHING</option>
          <option>SHOES</option>
          <option>ACCESSORIES</option>
        </select>
        <label className="muted" style={{ marginTop: '6px' }}>SKU</label>
        <select 
          id="skuSel" 
          title="SKU 필터"
          value={filters.sku.length > 0 ? filters.sku[0] : ''}
          onChange={(e) => {
            const value = e.target.value;
            setFilters(prev => ({ ...prev, sku: value ? [value] : [] }));
          }}
        >
          <option value="">전체</option>
          <option>SKU-001</option>
          <option>SKU-002</option>
          <option>SKU-003</option>
        </select>
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