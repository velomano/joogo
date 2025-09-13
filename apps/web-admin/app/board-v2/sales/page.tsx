'use client';

import React, { useState } from 'react';
import SalesKpiOverview from '../../../src/components/sales/SalesKpiOverviewV2';

export default function SalesAnalysisPage() {
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
      <main className="main">
        <section className="panel">
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* 판매 KPI 오버뷰 */}
            <SalesKpiOverview 
              key={`kpi-${refreshTrigger}-${Date.now()}`}
              filters={filters} 
              refreshTrigger={refreshTrigger} 
            />

            {/* 일별 추이 + 시즌성 */}
            <div className="chart-container">
              <h3>📈 일별 추이 + 시즌성</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                매출/주문/광고비 일별 추이 + 7일/28일 이동평균, 구간 드래그줌 (구현 예정)
              </div>
            </div>

            {/* 캘린더 히트맵 */}
            <div className="chart-container">
              <h3>📅 캘린더 히트맵</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                일매출 히트맵 + 이벤트/공휴일 오버레이, 주간 드릴다운 (구현 예정)
              </div>
            </div>

            {/* 요일/시간대 패턴 */}
            <div className="chart-container">
              <h3>⏰ 요일/시간대 패턴</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                요일 평균, 시간대 분포(Box/Bar) 분석 (구현 예정)
              </div>
            </div>

            {/* 채널 성과/ROAS */}
            <div className="chart-container">
              <h3>📺 채널 성과/ROAS</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Grouped Bar + ROAS 라인, ROAS&lt;1 경고 배지 (구현 예정)
              </div>
            </div>

            {/* 지역 성과 */}
            <div className="chart-container">
              <h3>🗺️ 지역 성과</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                지도/Bar, 상위 10개 지역 AOV/주문 비교 (구현 예정)
              </div>
            </div>

            {/* 카테고리·상품 파레토/ABC */}
            <div className="chart-container">
              <h3>📊 카테고리·상품 파레토/ABC</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Pareto 누적, ABC 등급, 재고 컬럼 연동 (구현 예정)
              </div>
            </div>

            {/* 가격 탄력성 */}
            <div className="chart-container">
              <h3>💰 가격 탄력성</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Scatter log(price) vs log(qty), 회귀선, 구간별 탄력성 카드 (구현 예정)
              </div>
            </div>

            {/* 캠페인/프로모션 효과 */}
            <div className="chart-container">
              <h3>🎯 캠페인/프로모션 효과</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Before/After + Welch t-test, p-value 배지 (구현 예정)
              </div>
            </div>

            {/* 이상치 탐지 */}
            <div className="chart-container">
              <h3>⚠️ 이상치 탐지</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                z-score 테이블 및 히스토그램, |z|≥2.5 기본 (구현 예정)
              </div>
            </div>

            {/* 트래픽→주문 퍼널 */}
            <div className="chart-container">
              <h3>🔄 트래픽→주문 퍼널</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                Funnel 및 디바이스별 라인 (구현 예정)
              </div>
            </div>

            {/* 날씨 상관 */}
            <div className="chart-container">
              <h3>🌤️ 날씨 상관</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                온도/습도 vs 매출 상관, 버킷 바 (구현 예정)
              </div>
            </div>

            {/* 수익성 카드 */}
            <div className="chart-container">
              <h3>💎 수익성 카드</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                총이익, 기여이익율, 손익분기 AOV (구현 예정)
              </div>
            </div>

            {/* OOS 영향 */}
            <div className="chart-container">
              <h3>📦 OOS 영향</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                stockout_days, lost_sales 추정, 재고 딥링크 (구현 예정)
              </div>
            </div>

            {/* 알림 카드 */}
            <div className="chart-container">
              <h3>🔔 알림 카드</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                ROAS&lt;1, AOV 급락, 탄력성 극단 값 등 규칙 기반 (구현 예정)
              </div>
            </div>

            {/* 내보내기/액션큐 */}
            <div className="chart-container">
              <h3>📤 내보내기/액션큐</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                CSV/XLSX, ActionQueue 초안으로 전송 (구현 예정)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
