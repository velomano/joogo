'use client';

import React, { useState } from 'react';
import InventoryStatusChart from '../../../src/components/analytics/InventoryStatusChart';
import InventoryTurnoverChart from '../../../src/components/analytics/InventoryTurnoverChart';
import InventoryAlertsChart from '../../../src/components/analytics/InventoryAlertsChart';
import InventoryValueChart from '../../../src/components/analytics/InventoryValueChart';

export default function InventoryAnalysisPage() {
  console.log('InventoryAnalysisPage 렌더링됨');

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
        <h1>재고 분석 <span className="muted">v2</span></h1>
        
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
               {/* 재고 현황 */}
               <InventoryStatusChart 
                 filters={filters} 
               />
               
               {/* 재고 회전율 분석 */}
               <InventoryTurnoverChart 
                 filters={filters} 
               />
               
               {/* 재고 부족 알림 */}
               <InventoryAlertsChart 
                 filters={filters} 
               />
               
               {/* 재고 가치 분석 */}
               <InventoryValueChart 
                 filters={filters} 
               />
             </main>
    </div>
  );
}