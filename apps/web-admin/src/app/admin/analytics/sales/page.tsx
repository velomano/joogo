'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';

export default function SalesAnalyticsPage() {
  // 개발용 고정 테넌트 ID - 자동으로 설정
  const defaultTenant = useMemo(() => '84949b3c-2cb7-4c42-b9f9-d1f37d371e00', []);
  const [tenantId, setTenantId] = useState(defaultTenant);
  const [items, setItems] = useState<any[]>([]);
  const [salesWithPrice, setSalesWithPrice] = useState<any[]>([]);
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  
  // 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingQuery, setPendingQuery] = useState('');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('qty');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const load = useCallback(async () => {
    if (!tenantId) {
      setMsg('테넌트 ID가 필요합니다.');
      return;
    }
    
    setLoading(true);
    try {
      // 새로운 sales-summary API 사용 (전체 데이터)
      const res = await fetch(`/api/analytics/sales-summary?tenant_id=${tenantId}`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      console.log('API 응답 데이터:', json);
      console.log('all_items 샘플:', json.all_items?.slice(0, 3));
      
      // 새로운 API 구조에 맞게 데이터 설정
      setItems(json.all_items || []);
      setSalesWithPrice(json.sales_with_price || []);
      setSalesSummary(json.sales_summary || null);
      setLastRefreshed(new Date().toLocaleTimeString());
      setMsg(null); // 성공 시 에러 메시지 제거
    } catch (e: any) {
      setMsg(`데이터 로드 실패: ${e?.message || '알 수 없는 오류'}`);
      console.error('Load error:', e);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // 페이지 마운트 시에만 한 번 실행
  useEffect(() => {
    if (tenantId) {
      load();
    }
  }, [tenantId, load]); // tenantId와 load 함수를 의존성에 추가

  // 페이지 포커스 시 자동 데이터 새로고침 (페이지 이동 후 돌아올 때)
  useEffect(() => {
    const handleFocus = () => {
      if (tenantId && items.length === 0) {
        load();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [tenantId, items.length, load]);

  // 재고 통계 계산
  const stats = useMemo(() => {
    if (!items.length) return {
      totalProducts: 0,
      totalQuantity: 0,
      averageQuantity: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      highStockCount: 0
    };

    const totalProducts = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + Number(item.qty || 0), 0);
    const averageQuantity = totalProducts > 0 ? totalQuantity / totalProducts : 0;
    
    const lowStockCount = items.filter(item => Number(item.qty || 0) < 10).length;
    const outOfStockCount = items.filter(item => Number(item.qty || 0) === 0).length;
    const highStockCount = items.filter(item => Number(item.qty || 0) >= 50).length;

    return {
      totalProducts,
      totalQuantity,
      averageQuantity,
      lowStockCount,
      outOfStockCount,
      highStockCount
    };
  }, [items]);

  // 상위 재고 상품 (수량 기준)
  const topStockItems = useMemo(() => {
    return [...items]
      .sort((a, b) => Number(b.qty || 0) - Number(a.qty || 0))
      .slice(0, 10);
  }, [items]);

  // 필터링/정렬 임계값
  const thresholds = { low: 5, high: 20 };

  // 검색 실행 핸들러
  const handleSearch = useCallback(() => {
    setSearchTerm(pendingQuery);
  }, [pendingQuery]);

  // 필터링된 데이터 (검색 → 재고상태 → 정렬)
  const filteredItems = useMemo(() => {
    let filtered = [...items];
    
    // 1. 검색 필터 (안전 문자열 정규화 사용)
    const q = normalizeText(searchTerm).trim();
    if (q) {
      filtered = filtered.filter(item =>
        normalizeText(item.product_name).includes(q) ||
        normalizeText(item.barcode).includes(q) ||
        normalizeText(item.option_name).includes(q)
      );
    }
    
    // 2. 재고 상태 필터
    if (stockFilter !== 'ALL') {
      filtered = filtered.filter(item => {
        const qty = Number(item.qty || 0);
        switch (stockFilter) {
          case 'OUT': return qty === 0;
          case 'LOW': return qty > 0 && qty <= thresholds.low;
          case 'NORMAL': return qty > thresholds.low && qty < thresholds.high;
          case 'PLENTY': return qty >= thresholds.high;
          default: return true;
        }
      });
    }
    
    // 3. 정렬 (문자/숫자 비교 안전화)
    filtered.sort((a, b) => {
      const key = sortKey as any;
      const dir = sortDir;
      if (key === 'qty' || key === 'price') {
        return compareNum(a[key], b[key], dir);
      }
      return compareStr(a[key], b[key], dir);
    });
    
    return filtered;
  }, [items, searchTerm, stockFilter, sortKey, sortDir, thresholds]);

  // 부족 재고 상품
  const lowStockItems = useMemo(() => {
    return items
      .filter(item => Number(item.qty || 0) < 10)
      .sort((a, b) => Number(a.qty || 0) - Number(b.qty || 0))
      .slice(0, 10);
  }, [items]);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">재고 분석 (실시간 데이터)</h1>

      {/* 상단 툴바 - 고정 */}
      <div className="bg-white rounded-xl shadow-lg border p-4 space-y-4">
        {/* 메인 컨트롤 */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
          {/* 검색 입력 + 버튼 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={pendingQuery}
              onChange={(e) => setPendingQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="상품명/옵션/바코드 검색..."
              aria-label="검색"
              className="flex-1 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              aria-label="검색 실행"
              className="w-24 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              🔍 검색
            </button>
          </div>
          
          {/* 재고 상태 필터 */}
          <div>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              aria-label="재고 상태 필터"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">전체</option>
              <option value="OUT">품절</option>
              <option value="LOW">부족</option>
              <option value="NORMAL">보통</option>
              <option value="PLENTY">충분</option>
            </select>
          </div>
          
          {/* 정렬 기준 */}
          <div>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="정렬 기준"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="qty">수량</option>
              <option value="product_name">상품명</option>
            </select>
          </div>
          
          {/* 정렬 방향 */}
          <div>
            <button
              onClick={() => setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')}
              aria-label="정렬 방향 변경"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              {sortDir === 'asc' ? '↑ 오름차순' : '↓ 내림차순'}
            </button>
          </div>
        </div>
        
        {/* 결과 요약 바 */}
        <div className="flex flex-wrap justify-between items-center gap-3 p-3 bg-gray-50 rounded-lg border">
          <div className="text-sm text-gray-700">
            표시 <span className="font-semibold text-blue-600">{filteredItems.length}</span> / 전체 <span className="font-semibold">{items.length}</span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* 필터 칩들 */}
            {stockFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                상태: {stockFilter === 'OUT' ? '품절' : stockFilter === 'LOW' ? '부족' : stockFilter === 'NORMAL' ? '보통' : '충분'}
                <button
                  onClick={() => setStockFilter('ALL')}
                  aria-label="재고 상태 필터 제거"
                  className="ml-1 hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                검색: {searchTerm}
                <button
                  onClick={() => setSearchTerm('')}
                  aria-label="검색어 제거"
                  className="ml-1 hover:bg-green-200 rounded-full w-4 h-4 flex items-center justify-center"
                >
                  ×
                </button>
              </span>
            )}
            
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              정렬: {sortKey === 'qty' ? '수량' : '상품명'} {sortDir === 'asc' ? '↑' : '↓'}
            </span>
          </div>
          
          <button
            onClick={() => {
              setPendingQuery('');
              setSearchTerm('');
              setStockFilter('ALL');
              setSortKey('qty');
              setSortDir('desc');
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline hover:no-underline transition-colors"
          >
            전체 초기화
          </button>
        </div>
      </div>

      <div className="flex gap-2 items-end">
        <div>
          <label className="block text-sm mb-1">테넌트 ID <span className="text-green-500">✓ 자동 설정됨</span></label>
          <input 
            className="border rounded px-3 py-2 w-[420px] bg-gray-50 text-gray-600" 
            value={tenantId} 
            onChange={e => setTenantId(e.target.value)}
            placeholder="테넌트 ID가 자동으로 설정되었습니다"
            readOnly
          />
          <p className="text-xs text-green-600 mt-1">개발용 테넌트 ID가 자동으로 설정되었습니다</p>
        </div>
        <button 
          onClick={load} 
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? '로딩 중...' : '데이터 새로고침'}
        </button>
        {lastRefreshed && <span className="text-sm text-gray-500">마지막 갱신 {lastRefreshed} · {items.length}개 상품</span>}
      </div>

      {msg && <div className="bg-gray-50 border rounded px-3 py-2">{msg}</div>}

      {/* 검색 결과가 있을 때만 표시 - 검색창 바로 아래 */}
      {searchTerm && (
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              🔍 검색 결과 ({filteredItems.length}개)
            </h3>
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              검색 초기화
            </button>
          </div>
          
          {filteredItems.length === 0 ? (
            /* Empty State */
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🔍</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
              <p className="text-gray-600 mb-6">
                "{searchTerm}" 검색어와 {stockFilter !== 'ALL' ? '현재 필터' : ''}에 맞는 상품을 찾을 수 없습니다.<br />
                검색어나 필터를 조정하거나 초기화해보세요.
              </p>
              <button
                onClick={() => {
                  setPendingQuery('');
                  setSearchTerm('');
                  setStockFilter('ALL');
                  setSortKey('qty');
                  setSortDir('desc');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                전체 초기화
              </button>
            </div>
          ) : (
            <>
              {/* 검색 결과 요약 */}
              <div className="space-y-6">
                {/* 1. 재고 관련 합계 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">📦 1. 재고 관련 합계</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <div className="text-sm text-green-600 font-medium">총 재고 수량</div>
                      <div className="text-2xl font-bold text-green-800">
                        {filteredItems.reduce((sum, item) => sum + Number(item.qty || 0), 0).toLocaleString()}개
                      </div>
                      <div className="text-xs text-green-600 mt-1">현재 남아 있는 수량 합계</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                      <div className="text-sm text-purple-600 font-medium">총 재고 판매가</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {(() => {
                          const totalValue = filteredItems.reduce((sum, item) => {
                            if (item.price && item.qty) {
                              return sum + (Number(item.price) * Number(item.qty));
                            }
                            return sum;
                          }, 0);
                          return totalValue > 0 ? `₩${totalValue.toLocaleString()}` : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-purple-600 mt-1">재고자산의 판매가치</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-600 font-medium">총 재고 원가</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {(() => {
                          const totalCost = filteredItems.reduce((sum, item) => {
                            if (item.cost_price && item.qty) {
                              return sum + (Number(item.cost_price) * Number(item.qty));
                            }
                            return sum;
                          }, 0);
                          return totalCost > 0 ? `₩${totalCost.toLocaleString()}` : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-orange-600 mt-1">재고자산의 원가</div>
                    </div>
                  </div>
                </div>

                {/* 2. 판매 관련 합계 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-3">💰 2. 판매 관련 합계</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                      <div className="text-sm text-indigo-600 font-medium">총 판매 수량</div>
                      <div className="text-2xl font-bold text-indigo-800">
                        {(() => {
                          // API에서 계산된 총 판매 수량 사용
                          if (salesSummary?.total_sold_qty) {
                            return salesSummary.total_sold_qty.toLocaleString() + '개';
                          }
                          // 폴백: 클라이언트에서 계산
                          const totalSold = filteredItems.reduce((sum, item) => {
                            if (item.original_data?.daily_data) {
                              const dailySales = Object.values(item.original_data.daily_data);
                              return sum + dailySales.reduce((daySum: number, dayQty: any) => daySum + Number(dayQty || 0), 0);
                            }
                            return sum;
                          }, 0);
                          return totalSold > 0 ? totalSold.toLocaleString() + '개' : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-indigo-600 mt-1">지금까지 실제로 판매된 수량</div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <div className="text-sm text-red-600 font-medium">총 판매 매출</div>
                      <div className="text-2xl font-bold text-red-800">
                        {(() => {
                          const totalRevenue = filteredItems.reduce((sum, item) => {
                            if (item.price && item.original_data?.daily_data) {
                              const dailySales = Object.values(item.original_data.daily_data);
                              const totalSold = dailySales.reduce((daySum: number, dayQty: any) => daySum + Number(dayQty || 0), 0);
                              return sum + (Number(item.price) * totalSold);
                            }
                            return sum;
                          }, 0);
                          return totalRevenue > 0 ? `₩${totalRevenue.toLocaleString()}` : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-red-600 mt-1">판매 수량 × 단가</div>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                      <div className="text-sm text-amber-600 font-medium">총 판매 원가</div>
                      <div className="text-2xl font-bold text-amber-800">
                        {(() => {
                          const totalCost = filteredItems.reduce((sum, item) => {
                            if (item.cost_price && item.original_data?.daily_data) {
                              const dailySales = Object.values(item.original_data.daily_data);
                              const totalSold = dailySales.reduce((daySum: number, dayQty: any) => daySum + Number(dayQty || 0), 0);
                              return sum + (Number(item.cost_price) * totalSold);
                            }
                            return sum;
                          }, 0);
                          return totalCost > 0 ? `₩${totalCost.toLocaleString()}` : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-amber-600 mt-1">판매 수량 × 원가</div>
                    </div>
                    <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium">총 판매 이익</div>
                      <div className="text-2xl font-bold text-emerald-800">
                        {(() => {
                          const totalRevenue = filteredItems.reduce((sum, item) => {
                            if (item.price && item.original_data?.daily_data) {
                              const dailySales = Object.values(item.original_data.daily_data);
                              const totalSold = dailySales.reduce((daySum: number, dayQty: any) => daySum + Number(dayQty || 0), 0);
                              return sum + (Number(item.price) * totalSold);
                            }
                            return sum;
                          }, 0);
                          const totalCost = filteredItems.reduce((sum, item) => {
                            if (item.cost_price && item.original_data?.daily_data) {
                              const dailySales = Object.values(item.original_data.daily_data);
                              const totalSold = dailySales.reduce((daySum: number, dayQty: any) => daySum + Number(dayQty || 0), 0);
                              return sum + (Number(item.cost_price) * totalSold);
                            }
                            return sum;
                          }, 0);
                          const profit = totalRevenue - totalCost;
                          return profit > 0 ? `₩${profit.toLocaleString()}` : 'N/A';
                        })()}
                      </div>
                      <div className="text-xs text-emerald-600 mt-1">총 판매 매출 - 총 판매 원가</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 상세 정보 테이블 */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">바코드</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">상품명</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">옵션명</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">재고수량</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">가격</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">상태</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">SKU</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">카테고리</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">업데이트</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredItems.map((item, index) => (
                      <tr key={`${item.tenant_id}-${item.barcode}`} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {highlight(item.barcode, searchTerm)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="max-w-xs">
                            <div className="font-medium text-gray-900">
                              {highlight(item.product_name, searchTerm)}
                            </div>
                            {item.sku && (
                              <div className="text-xs text-gray-500 mt-1">SKU: {item.sku}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {item.option_name ? (
                            <div className="text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded border">
                              {highlight(item.option_name, searchTerm)}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-right">
                            <span className={`text-lg font-bold ${
                              item.qty === 0 ? 'text-red-600' : 
                              item.qty < 10 ? 'text-yellow-600' : 
                              item.qty < 50 ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {item.qty.toLocaleString()}개
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-right space-y-1">
                            {item.price ? (
                              <div>
                                <span className="text-lg font-semibold text-green-600">
                                  판매가: ₩{Number(item.price).toLocaleString()}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                판매가 없음
                              </span>
                            )}
                            {item.cost_price ? (
                              <div>
                                <span className="text-sm text-orange-600">
                                  원가: ₩{Number(item.cost_price).toLocaleString()}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge qty={item.qty} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700">
                            {item.sku ? (
                              <span className="bg-gray-50 px-2 py-1 rounded border text-xs font-mono">
                                {item.sku}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-700">
                            {item.category ? (
                              <span className="bg-green-50 px-2 py-1 rounded border text-xs">
                                {item.category}
                              </span>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-gray-600">
                            {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* 데이터 완결성 분석 */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="text-sm font-medium text-yellow-800 mb-3">🔍 데이터 완결성 분석 (숨겨진 정보 포함)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${filteredItems.some(item => item.price) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>판매가: {filteredItems.filter(item => item.price).length}/{filteredItems.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${filteredItems.some(item => item.cost_price) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>원가: {filteredItems.filter(item => item.cost_price).length}/{filteredItems.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${filteredItems.some(item => item.option_name) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>옵션: {filteredItems.filter(item => item.option_name).length}/{filteredItems.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${filteredItems.some(item => item.category) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>카테고리: {filteredItems.filter(item => item.category).length}/{filteredItems.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${filteredItems.some(item => item.brand) ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>브랜드: {filteredItems.filter(item => item.brand).length}/{filteredItems.length}</span>
                  </div>
                </div>
                <p className="text-xs text-yellow-700 mt-3">
                  💡 숨겨진 정보: CSV 업로드 시 가격 정보가 <code>original_data</code> JSONB 필드에 저장되어 있습니다. 이제 추출하여 표시됩니다!
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 새 대시보드 - 상단 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow">
          <div className="text-blue-100 text-sm">총 상품 수</div>
          <div className="text-2xl font-bold mt-1">
            {stats.totalProducts.toLocaleString()}개
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg shadow">
          <div className="text-green-100 text-sm">총 재고 수량</div>
          <div className="text-2xl font-bold mt-1">
            {stats.totalQuantity.toLocaleString()}개
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg shadow">
          <div className="text-purple-100 text-sm">평균 수량</div>
          <div className="text-2xl font-bold mt-1">
            {Math.round(stats.averageQuantity)}개
          </div>
        </div>
      </div>

      {/* 추가 통계 카드 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
          <div className="text-yellow-800 text-sm font-medium">부족 재고</div>
          <div className="text-yellow-900 text-2xl font-bold mt-1">
            {stats.lowStockCount}개
          </div>
          <div className="text-yellow-600 text-sm mt-1">10개 미만</div>
        </div>
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
          <div className="text-red-800 text-sm font-medium">품절 상품</div>
          <div className="text-red-900 text-2xl font-bold mt-1">
            {stats.outOfStockCount}개
          </div>
          <div className="text-red-600 text-sm mt-1">0개</div>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-lg">
          <div className="text-indigo-800 text-sm font-medium">충분 재고</div>
          <div className="text-indigo-900 text-2xl font-bold mt-1">
            {stats.highStockCount}개
          </div>
          <div className="text-indigo-600 text-sm mt-1">50개 이상</div>
        </div>
      </div>

      {/* 상위 재고 상품 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">상위 재고 상품 (Top 10)</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2">순위</th>
                <th className="text-left px-4 py-2">바코드</th>
                <th className="text-left px-4 py-2">상품명</th>
                <th className="text-left px-4 py-2">현재 수량</th>
                <th className="text-left px-4 py-2">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {topStockItems.map((item, idx) => (
                <tr key={item.barcode} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">{idx + 1}</td>
                  <td className="px-4 py-2 font-medium">{highlight(item.barcode, searchTerm)}</td>
                  <td className="px-4 py-2">{highlight(item.product_name, searchTerm)}</td>
                  <td className="px-4 py-2 font-bold text-green-600">{item.qty.toLocaleString()}개</td>
                  <td className="px-4 py-2 text-sm text-gray-600">
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 부족 재고 상품 */}
      {lowStockItems.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">⚠️ 부족 재고 상품 (10개 미만)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-yellow-50">
                <tr>
                  <th className="text-left px-4 py-2">바코드</th>
                  <th className="text-left px-4 py-2">상품명</th>
                  <th className="text-left px-4 py-2">현재 수량</th>
                  <th className="text-left px-4 py-2">상태</th>
                  <th className="text-left px-4 py-2">업데이트</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((item) => (
                  <tr key={item.barcode} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{highlight(item.barcode, searchTerm)}</td>
                    <td className="px-4 py-2">{highlight(item.product_name, searchTerm)}</td>
                    <td className="px-4 py-2 font-bold text-yellow-600">{item.qty}개</td>
                    <td className="px-4 py-2">
                      {item.qty === 0 ? (
                        <span className="text-red-600 font-medium">품절</span>
                      ) : (
                        <span className="text-yellow-600 font-medium">부족</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 가격 정보가 있는 상품들 */}
      {salesWithPrice.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">💰 가격 정보가 있는 상품들 ({salesWithPrice.length}개)</h3>
          <p className="text-sm text-gray-600 mb-4">
            이 상품들은 판매 데이터에 가격 정보가 있어서 검색해볼 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-green-50">
                <tr>
                  <th className="text-left px-4 py-2">바코드</th>
                  <th className="text-left px-4 py-2">상품명</th>
                  <th className="text-left px-4 py-2">옵션</th>
                  <th className="text-left px-4 py-2">판매가</th>
                  <th className="text-left px-4 py-2">판매수량</th>
                  <th className="text-left px-4 py-2">판매일</th>
                </tr>
              </thead>
              <tbody>
                {salesWithPrice.slice(0, 20).map((item, index) => (
                  <tr key={`${item.barcode}-${index}`} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">
                      <div className="font-mono text-sm bg-blue-100 px-2 py-1 rounded">
                        {item.barcode}
                      </div>
                    </td>
                    <td className="px-4 py-2 font-medium">{item.product_name || '상품명 없음'}</td>
                    <td className="px-4 py-2">
                      {item.option_name ? (
                        <span className="text-sm text-gray-700 bg-blue-50 px-2 py-1 rounded border">
                          {item.option_name}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-bold text-green-600">
                      ₩{Number(item.unit_price).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-center">{item.qty}개</td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.sale_date ? new Date(item.sale_date).toLocaleDateString('ko-KR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {salesWithPrice.length > 20 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              최근 20개만 표시됩니다. 전체 {salesWithPrice.length}개 중...
            </div>
          )}
        </div>
      )}

      {/* 전체 상품 목록 (검색 결과가 없을 때만 표시) */}
      {!searchTerm && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">전체 상품 목록</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2">바코드</th>
                  <th className="text-left px-4 py-2">상품명</th>
                  <th className="text-left px-4 py-2">현재 수량</th>
                  <th className="text-left px-4 py-2">상태</th>
                  <th className="text-left px-4 py-2">업데이트</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 100).map((item) => (
                  <tr key={item.barcode} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{item.barcode}</td>
                    <td className="px-4 py-2">{item.product_name || item.productname || '상품명 없음'}</td>
                    <td className="px-4 py-2 font-bold">{item.qty.toLocaleString()}개</td>
                    <td className="px-4 py-2">
                      <StatusBadge qty={item.qty} />
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString('ko-KR') : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {items.length > 100 && (
            <div className="mt-4 text-center text-sm text-gray-600">
              최근 100개만 표시됩니다. 전체 {items.length}개 중...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 안전 문자열 정규화 유틸
function normalizeText(v: unknown): string {
  if (v == null) return "";
  try {
    if (Array.isArray(v)) return v.map(x => normalizeText(x)).join(" ");
    if (typeof v === 'object' && v instanceof Date) return String(v.toISOString()).toLowerCase();
    if (typeof v === 'object') return String(JSON.stringify(v)).toLowerCase();
    return String(v).toLowerCase();
  } catch {
    return "";
  }
}

// 문자열 비교
function compareStr(a: unknown, b: unknown, dir: 'asc'|'desc') {
  const aa = normalizeText(a);
  const bb = normalizeText(b);
  return dir === 'asc' ? aa.localeCompare(bb) : bb.localeCompare(aa);
}

// 숫자 비교 (null/undefined는 가장 작게 취급)
function compareNum(a: unknown, b: unknown, dir: 'asc'|'desc') {
  const aa = Number(a ?? Number.NEGATIVE_INFINITY);
  const bb = Number(b ?? Number.NEGATIVE_INFINITY);
  return dir === 'asc' ? (aa - bb) : (bb - aa);
}

// 검색어 하이라이트 유틸
function highlight(text: unknown, q: string): React.ReactNode {
  const s = normalizeText(text);
  const query = normalizeText(q);
  if (!query) return String(text ?? "");
  const idx = s.indexOf(query);
  if (idx < 0) return String(text ?? "");
  const raw = String(text ?? "");
  // 원문 인덱스를 맞추기 위해 소문자 비교 기준으로 분리
  const before = raw.slice(0, idx);
  const match = raw.slice(idx, idx + query.length);
  const after = raw.slice(idx + query.length);
  return <>{before}<mark className="bg-yellow-200 rounded px-0.5 font-medium">{match}</mark>{after}</>;
}

// 상태 뱃지 컴포넌트
function StatusBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">품절</span>;
  } else if (qty < 10) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">부족</span>;
  } else if (qty < 50) {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">보통</span>;
  } else {
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">충분</span>;
  }
}
