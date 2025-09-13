'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { GridLayout, GridItem } from '../../../components/dashboard/GridLayout';
import { useFilters } from '../../../hooks/useFilters';

// Dynamic imports for better performance
const SalesKpiOverview = dynamic(() => import('../../../components/sales/SalesKpiOverview'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>KPI 로딩 중...</div>
});

const SalesTrendChart = dynamic(() => import('../../../components/sales/SalesTrendChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>추이 차트 로딩 중...</div>
});

const CalendarHeatmap = dynamic(() => import('../../../components/sales/CalendarHeatmap'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>캘린더 로딩 중...</div>
});

const ChannelPerformance = dynamic(() => import('../../../components/sales/ChannelPerformance'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>채널 성과 로딩 중...</div>
});

const RegionPerformance = dynamic(() => import('../../../components/sales/RegionPerformance'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>지역 성과 로딩 중...</div>
});

const ParetoAnalysis = dynamic(() => import('../../../components/sales/ParetoAnalysis'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>파레토 분석 로딩 중...</div>
});

const PriceElasticity = dynamic(() => import('../../../components/sales/PriceElasticity'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>가격 탄력성 로딩 중...</div>
});

const AnomalyDetection = dynamic(() => import('../../../components/sales/AnomalyDetection'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>이상치 탐지 로딩 중...</div>
});

export default function SalesAnalysisPage() {
  const { filters, setFrom, setTo, setRegion, setChannel, setCategory, setSku, resetFilters } = useFilters();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const filtersComponent = (
    <div>
      <label className="muted" style={{ color: '#9ca3af' }}>기간</label>
      <div className="row" style={{ margin: '8px 0' }}>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ 
            marginRight: '8px',
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            color: '#f9fafb',
            borderRadius: '4px',
            padding: '4px 8px'
          }}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setTo(e.target.value)}
          style={{
            backgroundColor: '#374151',
            border: '1px solid #4b5563',
            color: '#f9fafb',
            borderRadius: '4px',
            padding: '4px 8px'
          }}
        />
      </div>

      <label className="muted" style={{ color: '#9ca3af' }}>지역</label>
      <select 
        multiple 
        value={filters.region}
        onChange={(e) => setRegion(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ 
          marginBottom: '8px',
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          color: '#f9fafb',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <option value="SEOUL">서울</option>
        <option value="BUSAN">부산</option>
        <option value="DAEGU">대구</option>
        <option value="INCHEON">인천</option>
        <option value="GWANGJU">광주</option>
        <option value="DAEJEON">대전</option>
        <option value="ULSAN">울산</option>
      </select>

      <label className="muted" style={{ color: '#9ca3af' }}>채널</label>
      <select 
        multiple 
        value={filters.channel}
        onChange={(e) => setChannel(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ 
          marginBottom: '8px',
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          color: '#f9fafb',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <option value="naver">네이버</option>
        <option value="coupang">쿠팡</option>
        <option value="google">구글</option>
        <option value="meta">메타</option>
      </select>

      <label className="muted" style={{ color: '#9ca3af' }}>카테고리</label>
      <select 
        multiple 
        value={filters.category}
        onChange={(e) => setCategory(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ 
          marginBottom: '8px',
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          color: '#f9fafb',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
      >
        <option value="TOPS">상의</option>
        <option value="BOTTOMS">하의</option>
        <option value="SHOES">신발</option>
        <option value="BAGS">가방</option>
        <option value="ACCESSORIES">액세서리</option>
      </select>

      <label className="muted" style={{ color: '#9ca3af' }}>SKU</label>
      <select 
        multiple 
        value={filters.sku}
        onChange={(e) => setSku(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ 
          marginBottom: '8px',
          backgroundColor: '#374151',
          border: '1px solid #4b5563',
          color: '#f9fafb',
          borderRadius: '4px',
          padding: '4px 8px'
        }}
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
          marginBottom: '8px',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer'
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
          width: '100%',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer'
        }}
      >
        초기화
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title="판매 분석"
      subtitle="v2 (통합 대시보드)"
      filters={filtersComponent}
      actions={actionsComponent}
    >
      <GridLayout page="sales">
        {/* KPI 오버뷰 */}
        <GridItem id="kpi">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📊 KPI 오버뷰</h3>
          <SalesKpiOverview 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 일별 추이 + 시즌성 */}
        <GridItem id="trend">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📈 일별 추이</h3>
          <SalesTrendChart 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 캘린더 히트맵 */}
        <GridItem id="calendar">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📅 캘린더 히트맵</h3>
          <CalendarHeatmap 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 채널 성과/ROAS */}
        <GridItem id="channel">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📺 채널 성과</h3>
          <ChannelPerformance 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 지역 성과 */}
        <GridItem id="region">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🗺️ 지역 성과</h3>
          <RegionPerformance 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 파레토/ABC 분석 */}
        <GridItem id="pareto">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📊 파레토 분석</h3>
          <ParetoAnalysis 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 가격 탄력성 */}
        <GridItem id="elasticity">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>💰 가격 탄력성</h3>
          <PriceElasticity 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>

        {/* 이상치 탐지 */}
        <GridItem id="anomaly">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>⚠️ 이상치 탐지</h3>
          <AnomalyDetection 
            from={filters.from}
            to={filters.to}
            region={filters.region}
            channel={filters.channel}
            category={filters.category}
            sku={filters.sku}
            refreshTrigger={refreshTrigger}
          />
        </GridItem>
      </GridLayout>
    </DashboardLayout>
  );
}
