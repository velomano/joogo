'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
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
      <hr className="line" />
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

      <label className="muted">지역</label>
      <select 
        multiple 
        value={filters.region}
        onChange={(e) => setRegion(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="SEOUL">서울</option>
        <option value="BUSAN">부산</option>
        <option value="DAEGU">대구</option>
        <option value="INCHEON">인천</option>
        <option value="GWANGJU">광주</option>
        <option value="DAEJEON">대전</option>
        <option value="ULSAN">울산</option>
      </select>

      <label className="muted">채널</label>
      <select 
        multiple 
        value={filters.channel}
        onChange={(e) => setChannel(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="naver">네이버</option>
        <option value="coupang">쿠팡</option>
        <option value="google">구글</option>
        <option value="meta">메타</option>
      </select>

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
        <h1>판매 분석 <span className="muted">v2 (통합 대시보드)</span></h1>
        
        {filtersComponent}
        {actionsComponent}
      </aside>

      <main className="main">
        <section className="panel">
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* KPI 오버뷰 */}
            <div className="chart-container">
              <h3>📊 KPI 오버뷰</h3>
              <SalesKpiOverview 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 일별 추이 + 시즌성 */}
            <div className="chart-container">
              <h3>📈 일별 추이</h3>
              <SalesTrendChart 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 캘린더 히트맵 */}
            <div className="chart-container">
              <h3>📅 캘린더 히트맵</h3>
              <CalendarHeatmap 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 채널 성과/ROAS */}
            <div className="chart-container">
              <h3>📺 채널 성과</h3>
              <ChannelPerformance 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 지역 성과 */}
            <div className="chart-container">
              <h3>🗺️ 지역 성과</h3>
              <RegionPerformance 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 파레토/ABC 분석 */}
            <div className="chart-container">
              <h3>📊 파레토 분석</h3>
              <ParetoAnalysis 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 가격 탄력성 */}
            <div className="chart-container">
              <h3>💰 가격 탄력성</h3>
              <PriceElasticity 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>

            {/* 이상치 탐지 */}
            <div className="chart-container">
              <h3>⚠️ 이상치 탐지</h3>
              <AnomalyDetection 
                from={filters.from}
                to={filters.to}
                region={filters.region}
                channel={filters.channel}
                category={filters.category}
                sku={filters.sku}
                refreshTrigger={refreshTrigger}
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
