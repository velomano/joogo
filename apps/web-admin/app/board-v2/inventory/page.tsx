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
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const resetFilters = () => {
    setFilters({
      search: '',
    });
  };

  const handleSearch = async () => {
    if (!filters.search.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/analytics/inventory-search?q=${encodeURIComponent(filters.search)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
      setShowSearchModal(true);
    } catch (error) {
      console.error('검색 오류:', error);
      setSearchResults([]);
      setShowSearchModal(true);
    } finally {
      setSearchLoading(false);
    }
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
               <div className="row" style={{ display: 'flex', gap: '8px' }}>
                 <input 
                   type="text" 
                   placeholder="SKU, 상품명, 카테고리 검색..." 
                   value={filters.search} 
                   onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                   onKeyPress={(e) => {
                     if (e.key === 'Enter') {
                       handleSearch();
                     }
                   }}
                   style={{ 
                     flex: 1,
                     padding: '8px 12px',
                     border: '1px solid #d1d5db',
                     borderRadius: '4px',
                     fontSize: '14px'
                   }}
                 />
                 <button 
                   onClick={handleSearch}
                   className="btn"
                   style={{ 
                     backgroundColor: '#3b82f6', 
                     color: 'white',
                     padding: '8px 16px',
                     border: 'none',
                     borderRadius: '4px',
                     cursor: 'pointer',
                     fontSize: '14px'
                   }}
                 >
                   검색
                 </button>
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

      {/* 검색 결과 팝업 */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '12px',
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* 헤더 */}
            <div style={{
              padding: '20px',
              borderBottom: '1px solid #374151',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                margin: 0, 
                color: '#ffffff' 
              }}>
                🔍 검색 결과: "{filters.search}"
              </h2>
              <button
                onClick={() => setShowSearchModal(false)}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ×
              </button>
            </div>

            {/* 검색 결과 내용 */}
            <div style={{ 
              padding: '20px', 
              overflow: 'auto',
              flex: 1
            }}>
              {searchLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  검색 중...
                </div>
              ) : searchResults.length > 0 ? (
                <div style={{ display: 'grid', gap: '16px' }}>
                  {searchResults.map((item, index) => (
                    <div key={index} style={{
                      backgroundColor: '#374151',
                      padding: '20px',
                      borderRadius: '8px',
                      border: '1px solid #4b5563'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '20px', alignItems: 'start' }}>
                        {/* 상품 정보 */}
                        <div>
                          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#ffffff' }}>
                            {item.productName}
                          </h3>
                          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                            SKU: {item.sku}
                          </div>
                          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>
                            카테고리: {item.category}
                          </div>
                          <div style={{ fontSize: '14px', color: '#9ca3af' }}>
                            브랜드: {item.brand || 'N/A'}
                          </div>
                        </div>

                        {/* 재고 상세 정보 */}
                        <div>
                          <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#ffffff' }}>
                            재고 상세 정보
                          </h4>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>현재 재고</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                                {item.currentStock?.toLocaleString() || 0}개
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>일평균 판매</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                                {item.avgDailySales?.toFixed(1) || 0}개
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>회전율</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                                {item.turnoverRate?.toFixed(1) || 0}회
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>공급일수</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
                                {item.daysOfSupply || 0}일
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>재주문점</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                                {item.reorderPoint?.toLocaleString() || 0}개
                              </div>
                            </div>
                            <div>
                              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>단가</div>
                              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {item.unitCost?.toLocaleString() || 0}원
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 상태 및 액션 */}
                        <div>
                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>재고 상태</div>
                            <div style={{
                              padding: '8px 12px',
                              borderRadius: '6px',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              textAlign: 'center',
                              backgroundColor: item.status === 'in-stock' ? '#10b981' : 
                                            item.status === 'low-stock' ? '#f59e0b' : 
                                            item.status === 'out-of-stock' ? '#ef4444' : '#6b7280',
                              color: '#ffffff'
                            }}>
                              {item.status === 'in-stock' ? '재고 충분' :
                               item.status === 'low-stock' ? '재고 부족' :
                               item.status === 'out-of-stock' ? '품절' : '알 수 없음'}
                            </div>
                          </div>

                          <div style={{ marginBottom: '16px' }}>
                            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>재고 가치</div>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                              {((item.currentStock || 0) * (item.unitCost || 0)).toLocaleString()}원
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}>
                              재주문
                            </button>
                            <button style={{
                              backgroundColor: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '8px 12px',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}>
                              상세보기
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}