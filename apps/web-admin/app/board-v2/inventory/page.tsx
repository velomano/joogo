'use client';

import React, { useState } from 'react';
import InventoryStatusChart from '../../../src/components/analytics/InventoryStatusChart';
import InventoryTurnoverChart from '../../../src/components/analytics/InventoryTurnoverChart';
import InventoryAlertsChart from '../../../src/components/analytics/InventoryAlertsChart';
import InventoryValueChart from '../../../src/components/analytics/InventoryValueChart';

export default function InventoryAnalysisPage() {
  console.log('InventoryAnalysisPage 렌더링됨');

  // 오늘 기준 한 달 전부터 오늘까지
  const [filters, setFilters] = useState({
    search: '',
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
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
        <label className="muted">상품 검색</label>
        <div className="row">
          <input 
            type="text" 
            placeholder="SKU, 상품명, 카테고리 검색..." 
            value={filters.search} 
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{ 
              width: '100%', 
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>
        
        {/* 검색 옵션 */}
        <div style={{ marginBottom: '12px' }}>
          <div className="muted" style={{ marginBottom: '6px' }}>빠른 필터</div>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {[
              { value: 'low-stock', label: '재고부족' },
              { value: 'out-of-stock', label: '품절' },
              { value: 'high-turnover', label: '고회전율' },
              { value: 'dead-stock', label: '악성재고' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setFilters(prev => ({
                    ...prev,
                    search: option.value
                  }));
                }}
                className="btn"
                style={{ 
                  fontSize: '11px', 
                  padding: '4px 8px',
                  backgroundColor: filters.search === option.value ? '#3b82f6' : '#f3f4f6',
                  border: '1px solid #d1d5db',
                  color: filters.search === option.value ? '#ffffff' : '#374151',
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