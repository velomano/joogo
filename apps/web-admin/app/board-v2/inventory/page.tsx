'use client';

import React, { useState } from 'react';

export default function InventoryAnalysisPage() {
  const [filters, setFilters] = useState({
    from: '2025-01-01',
    to: '2025-01-31',
    sku: [],
    category: [],
    location: [],
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      from: '2025-01-01',
      to: '2025-01-31',
      sku: [],
      category: [],
      location: [],
    });
  };

  const filtersComponent = (
    <div>
      <hr className="line" />
      <label className="muted">기간</label>
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

      <label className="muted">SKU</label>
      <select 
        multiple 
        value={filters.sku}
        onChange={(e) => setFilters(prev => ({ 
          ...prev, 
          sku: Array.from(e.target.selectedOptions, option => option.value) 
        }))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS-001">TOPS-001</option>
        <option value="BOTTOMS-001">BOTTOMS-001</option>
        <option value="SHOES-001">SHOES-001</option>
        <option value="BAGS-001">BAGS-001</option>
      </select>

      <label className="muted">카테고리</label>
      <select 
        multiple 
        value={filters.category}
        onChange={(e) => setFilters(prev => ({ 
          ...prev, 
          category: Array.from(e.target.selectedOptions, option => option.value) 
        }))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS">상의</option>
        <option value="BOTTOMS">하의</option>
        <option value="SHOES">신발</option>
        <option value="BAGS">가방</option>
        <option value="ACCESSORIES">액세서리</option>
      </select>

      <label className="muted">위치</label>
      <select 
        multiple 
        value={filters.location}
        onChange={(e) => setFilters(prev => ({ 
          ...prev, 
          location: Array.from(e.target.selectedOptions, option => option.value) 
        }))}
        style={{ marginBottom: '8px' }}
      >
        <option value="W1">창고1</option>
        <option value="W2">창고2</option>
        <option value="W3">창고3</option>
        <option value="STORE">매장</option>
      </select>
    </div>
  );

  const actionsComponent = (
    <div>
      <hr className="line" />
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
    </div>
  );

  return (
    <div className="wrap">
      <aside className="sidebar panel">
        <h1>재고 분석 <span className="muted">v2</span></h1>
        
        {filtersComponent}
        {actionsComponent}
      </aside>

      <main className="main">
        <section className="panel">
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* 재고 KPI 오버뷰 */}
            <div className="chart-container">
              <h3>📊 재고 KPI 오버뷰</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                재고 KPI 모듈 (구현 예정)
              </div>
            </div>

            {/* 품절/임박 품절 */}
            <div className="chart-container">
              <h3>⚠️ 품절/임박 품절</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                품절 위험 모듈 (구현 예정)
              </div>
            </div>

            {/* 과잉/저회전 */}
            <div className="chart-container">
              <h3>📦 과잉/저회전</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                과잉 재고 모듈 (구현 예정)
              </div>
            </div>

            {/* ABC(재고 기준) + 파레토 */}
            <div className="chart-container">
              <h3>📈 ABC(재고 기준) + 파레토</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                재고 ABC 분석 모듈 (구현 예정)
              </div>
            </div>

            {/* 재고 노화(Aging) */}
            <div className="chart-container">
              <h3>⏰ 재고 노화(Aging)</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                재고 노화 분석 모듈 (구현 예정)
              </div>
            </div>

            {/* 재주문 제안 */}
            <div className="chart-container">
              <h3>🔄 재주문 제안</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                재주문 제안 모듈 (구현 예정)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
