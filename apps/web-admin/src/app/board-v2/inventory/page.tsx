'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { useFilters } from '../../../hooks/useFilters';

// Dynamic imports for better performance
const InventoryKpiOverview = dynamic(() => import('../../../components/inventory/InventoryKpiOverview'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>KPI 로딩 중...</div>
});

const StockoutRisk = dynamic(() => import('../../../components/inventory/StockoutRisk'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>품절 위험 로딩 중...</div>
});

const ExcessInventory = dynamic(() => import('../../../components/inventory/ExcessInventory'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>과잉 재고 로딩 중...</div>
});

const InventoryABC = dynamic(() => import('../../../components/inventory/InventoryABC'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>ABC 분석 로딩 중...</div>
});

const InventoryAging = dynamic(() => import('../../../components/inventory/InventoryAging'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>재고 노화 로딩 중...</div>
});

const ReorderSuggestions = dynamic(() => import('../../../components/inventory/ReorderSuggestions'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>재주문 제안 로딩 중...</div>
});

const WarehouseOps = dynamic(() => import('../../../components/inventory/WarehouseOps'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>창고 운영 로딩 중...</div>
});

const LocationHeatmap = dynamic(() => import('../../../components/inventory/LocationHeatmap'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>로케이션 히트맵 로딩 중...</div>
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
      <div style={{ display: 'grid', gap: '20px' }}>
        {/* 재고 KPI 오버뷰 */}
        <InventoryKpiOverview 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 품절/임박 품절 */}
        <StockoutRisk 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 과잉/저회전 */}
        <ExcessInventory 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* ABC 분석 + 파레토 */}
        <InventoryABC 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 재고 노화 */}
        <InventoryAging 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 재주문 제안 */}
        <ReorderSuggestions 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 입출고 흐름 */}
        <WarehouseOps 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />

        {/* 로케이션 히트맵 */}
        <LocationHeatmap 
          from={filters.from}
          to={filters.to}
          category={filters.category}
          sku={filters.sku}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </DashboardLayout>
  );
}
