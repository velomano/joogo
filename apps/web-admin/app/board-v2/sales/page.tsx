'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';

// 판매 분석 전용 컴포넌트들 - 기존 board-v2 컴포넌트 재사용
const RevenueSpendChart = dynamic(() => import('../_components/RevenueSpendChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>매출/광고비 차트 로딩 중...</div>
});

const SalesTemperatureChart = dynamic(() => import('../_components/SalesTemperatureChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>판매량/기온 차트 로딩 중...</div>
});

const CategoryPieChart = dynamic(() => import('../_components/CategoryPieChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>카테고리 차트 로딩 중...</div>
});

const RegionBarChart = dynamic(() => import('../_components/RegionBarChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>지역별 차트 로딩 중...</div>
});

const ParetoChart = dynamic(() => import('../_components/ParetoChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>파레토 차트 로딩 중...</div>
});

const SkuDetailChart = dynamic(() => import('../_components/SkuDetailChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>SKU 상세 차트 로딩 중...</div>
});

const RankResponseChart = dynamic(() => import('../_components/RankResponseChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>순위 반응 차트 로딩 중...</div>
});

const EventImpactChart = dynamic(() => import('../_components/EventImpactChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>이벤트 임팩트 차트 로딩 중...</div>
});

const ToggleCompareChart = dynamic(() => import('../_components/ToggleCompareChart'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>토글 비교 차트 로딩 중...</div>
});

const InsightCards = dynamic(() => import('../_components/InsightCards'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>인사이트 카드 로딩 중...</div>
});

export default function SalesAnalysisPage() {
  const [filters, setFilters] = useState({
    from: '2025-01-01',
    to: '2025-01-31',
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
      from: '2025-01-01',
      to: '2025-01-31',
      region: [],
      channel: [],
      category: [],
      sku: [],
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

      <label className="muted">지역</label>
      <select 
        multiple 
        value={filters.region}
        onChange={(e) => setFilters(prev => ({ 
          ...prev, 
          region: Array.from(e.target.selectedOptions, option => option.value) 
        }))}
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
        onChange={(e) => setFilters(prev => ({ 
          ...prev, 
          channel: Array.from(e.target.selectedOptions, option => option.value) 
        }))}
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
        <h1>판매 분석 <span className="muted">v2</span></h1>
        
        {filtersComponent}
        {actionsComponent}
      </aside>

      <main className="main">
        <section className="panel">
          {/* 인사이트 카드 */}
          <div className="chart-container">
            <InsightCards />
          </div>

          {/* 차트 그리드 */}
          <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: '1fr 1fr' }}>
            {/* 매출 × 광고비 × ROAS */}
            <div className="chart-container">
              <h3>매출 × 광고비 × ROAS</h3>
              <RevenueSpendChart />
            </div>

            {/* 판매량 × 평균기온 */}
            <div className="chart-container">
              <h3>판매량 × 평균기온</h3>
              <SalesTemperatureChart />
            </div>

            {/* 카테고리 매출 비중 */}
            <div className="chart-container">
              <h3>카테고리 매출 비중</h3>
              <CategoryPieChart />
            </div>

            {/* 지역별 매출 */}
            <div className="chart-container">
              <h3>지역별 매출</h3>
              <RegionBarChart />
            </div>

            {/* 파레토/ABC */}
            <div className="chart-container">
              <h3>파레토/ABC</h3>
              <ParetoChart />
            </div>

            {/* 선택 SKU 상세 */}
            <div className="chart-container">
              <h3>선택 SKU 상세</h3>
              <SkuDetailChart />
            </div>

            {/* 진열 순위 반응곡선 */}
            <div className="chart-container">
              <h3>진열 순위 반응곡선</h3>
              <RankResponseChart />
            </div>

            {/* 이벤트 전/후 임팩트 */}
            <div className="chart-container">
              <h3>이벤트 전/후 임팩트</h3>
              <EventImpactChart />
            </div>

            {/* 토글 비교 */}
            <div className="chart-container">
              <h3>토글 비교</h3>
              <ToggleCompareChart />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
