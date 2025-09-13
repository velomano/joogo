'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { GridLayout, GridItem } from '../../../components/dashboard/GridLayout';
import { useFilters } from '../../../hooks/useFilters';

// Dynamic imports for better performance
const InventoryStatusChart = dynamic(() => import('../../../components/analytics/InventoryStatusChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>재고 현황 로딩 중...</div>
});

const InventoryTurnoverChart = dynamic(() => import('../../../components/analytics/InventoryTurnoverChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>재고 회전율 로딩 중...</div>
});

const InventoryValueChart = dynamic(() => import('../../../components/analytics/InventoryValueChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>재고 가치 로딩 중...</div>
});

export default function InventoryAnalysisPage() {
  const { filters, setFrom, setTo, setCategory, setSku, resetFilters } = useFilters();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const filtersComponent = (
    <div>
      <label className="muted">기간</label>
      <div className="row" style={{ margin: '8px 0' }}>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ marginRight: '8px' }}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <label className="muted">카테고리</label>
      <select 
        multiple 
        value={filters.category}
        onChange={(e) => setCategory(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS">상의</option>
        <option value="BOTTOMS">하의</option>
        <option value="SHOES">신발</option>
        <option value="BAGS">가방</option>
        <option value="ACCESSORIES">액세서리</option>
      </select>

      <label className="muted">SKU</label>
      <select 
        multiple 
        value={filters.sku}
        onChange={(e) => setSku(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS-001">TOPS-001</option>
        <option value="BOTTOMS-001">BOTTOMS-001</option>
        <option value="SHOES-001">SHOES-001</option>
        <option value="BAGS-001">BAGS-001</option>
      </select>
    </div>
  );

  const actionsComponent = (
    <div>
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
    <DashboardLayout
      title="재고 분석"
      subtitle="v2 (통합 대시보드)"
      filters={filtersComponent}
      actions={actionsComponent}
    >
      <GridLayout page="inventory">
        {/* 재고 현황 */}
        <GridItem id="status">
          <InventoryStatusChart 
            filters={{
              search: '',
              from: filters.from,
              to: filters.to
            }}
          />
        </GridItem>

        {/* 재고 회전율 */}
        <GridItem id="turnover">
          <InventoryTurnoverChart 
            filters={{
              search: '',
              from: filters.from,
              to: filters.to
            }}
          />
        </GridItem>

        {/* 재고 가치 */}
        <GridItem id="value">
          <InventoryValueChart 
            filters={{
              search: '',
              from: filters.from,
              to: filters.to
            }}
          />
        </GridItem>
      </GridLayout>
    </DashboardLayout>
  );
}
