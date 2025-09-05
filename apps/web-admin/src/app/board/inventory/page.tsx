'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBanner from '@/components/ErrorBanner';
import { ensureChart, barConfig, lineConfig } from '@/lib/charts';

export default function InventoryAnalysisPage() {
  const router = useRouter();
  const [errMsg, setErrMsg] = useState('');
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');

  // 필터 상태
  const [region, setRegion] = useState('');
  const [channel, setChannel] = useState('');
  const [category, setCategory] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    region: '',
    channel: '',
    category: ''
  });

  // tenant_id 가져오기
  useEffect(() => {
    const loadTenantId = async () => {
      try {
        const response = await fetch('/api/tenants');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (json.tenants && json.tenants.length > 0) {
          setTenantId(json.tenants[0].id);
        } else {
          setTenantId('00000000-0000-0000-0000-000000000000');
        }
      } catch (err) {
        console.error('Tenant ID 로드 실패:', err);
        setTenantId('00000000-0000-0000-0000-000000000000');
      }
    };
    loadTenantId();
  }, []);

  // 데이터 로드
  useEffect(() => {
    if (!tenantId) return;
    
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/board/insights?tenant_id=${tenantId}&from=2025-01-01&to=2025-12-31&lead_time=7&z=1.65`);
        if (!response.ok) {
          if (response.status === 400) {
            console.log('📊 데이터가 없습니다. 빈 데이터로 초기화합니다.');
            setInsights({
              ok: true,
              inventoryAnalysis: [],
              stockLevels: [],
              turnoverAnalysis: []
            });
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        setInsights(json);
      } catch (err) {
        console.error('데이터 로드 에러:', err);
        setInsights({
          ok: true,
          inventoryAnalysis: [],
          stockLevels: [],
          turnoverAnalysis: []
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [tenantId]);

  // 조회 버튼 핸들러
  const handleApplyFilters = () => {
    setAppliedFilters({
      region,
      channel,
      category
    });
  };

  // 재고 관련 데이터 필터링
  const filteredInventory = useMemo(() => {
    if (!insights?.reorder) return [];
    
    return insights.reorder.filter((item: any) => {
      if (appliedFilters.region && item.region !== appliedFilters.region) return false;
      if (appliedFilters.channel && item.channel !== appliedFilters.channel) return false;
      if (appliedFilters.category && item.category !== appliedFilters.category) return false;
      return true;
    });
  }, [insights, appliedFilters]);

  // EOL 후보 데이터 필터링
  const filteredEOL = useMemo(() => {
    if (!insights?.eol) return [];
    
    return insights.eol.filter((item: any) => {
      if (appliedFilters.region && item.region !== appliedFilters.region) return false;
      if (appliedFilters.channel && item.channel !== appliedFilters.channel) return false;
      if (appliedFilters.category && item.category !== appliedFilters.category) return false;
      return true;
    });
  }, [insights, appliedFilters]);

  // 재고 상태별 통계 (API에서 계산된 값 우선 사용, 없으면 클라이언트에서 계산)
  const inventoryStats = useMemo(() => {
    // API에서 이미 계산된 값이 있으면 사용
    if (insights?.inventoryStats) {
      return {
        urgent: insights.inventoryStats.urgent || 0,
        review: insights.inventoryStats.review || 0,
        stable: insights.inventoryStats.stable || 0,
        eol: insights.inventoryStats.eol || 0,
        total: filteredInventory.length
      };
    }

    // API에서 계산된 값이 없으면 클라이언트에서 계산
    const urgent = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days <= 3
    );
    const review = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days > 3 && item.reorder_gap_days <= 7
    );
    const stable = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days > 7
    );

    return {
      urgent: urgent.length,
      review: review.length,
      stable: stable.length,
      eol: filteredEOL.length,
      total: filteredInventory.length
    };
  }, [insights?.inventoryStats, filteredInventory, filteredEOL]);

  // 기본 재고 통계 정보 계산
  const calculateInventoryStats = (data: any) => {
    if (!data) return null;
    
    const reorderData = data.reorder || [];
    const inventoryStats = data.inventoryStats || {};
    
    console.log('🔍 reorder 데이터 샘플:', reorderData[0]);
    console.log('🔍 재고 통계 데이터:', inventoryStats);
    
    const totalSkus = reorderData.length;
    const { totalStockValue = 0, avgStockLevel = 0 } = inventoryStats;
    
    const avgDailySales = totalSkus > 0 ? reorderData.reduce((sum: number, item: any) => 
      sum + Number(item.avg_daily || 0), 0) / totalSkus : 0;
    
    // 재고 회전율 (일평균 판매량 / 평균 재고)
    const turnoverRate = avgStockLevel > 0 ? avgDailySales / avgStockLevel : 0;
    
    console.log('🔍 계산된 통계:', {
      totalSkus,
      totalStockValue,
      avgStockLevel,
      avgDailySales,
      turnoverRate
    });
    
    return {
      totalSkus,
      totalStockValue,
      avgStockLevel: Math.round(avgStockLevel),
      avgDailySales: Math.round(avgDailySales * 100) / 100,
      turnoverRate: Math.round(turnoverRate * 100) / 100
    };
  };

  const basicStats = calculateInventoryStats(insights);

  // 차트 렌더링
  useEffect(() => {
    console.log('🔍 차트 렌더링 시작:', {
      filteredInventoryLength: filteredInventory.length,
      inventoryStats
    });
    
    if (!filteredInventory.length) {
      console.log('❌ filteredInventory가 비어있음');
      return;
    }

    // 1. 재고 상태별 SKU 수
    console.log('🔍 재고 상태별 차트 데이터:', {
      urgent: inventoryStats.urgent,
      review: inventoryStats.review,
      stable: inventoryStats.stable
    });
    
    ensureChart("chart-inventory-status", {
      type: 'doughnut',
      data: {
        labels: ['긴급 리오더', '리오더 검토', '안정'],
        datasets: [{
          data: [inventoryStats.urgent, inventoryStats.review, inventoryStats.stable],
          backgroundColor: ['#e74c3c', '#f39c12', '#27ae60'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: false
          },
          legend: {
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 8,
              font: {
                size: 11
              }
            }
          }
        }
      }
    });

    // 2. 리오더 포인트 vs 현재 재고
    const reorderData = filteredInventory.filter((item: any) => 
      item.reorder_point !== null && item.stock_on_hand !== null
    );

    ensureChart("chart-reorder-vs-stock", {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'SKU',
          data: reorderData.map((item: any) => ({
            x: Number(item.stock_on_hand || 0),
            y: Number(item.reorder_point || 0)
          })),
          backgroundColor: '#4ecdc4',
          borderColor: '#45b7d1',
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { 
              display: true, 
              text: '현재 재고',
              font: { size: 12 }
            },
            beginAtZero: true,
            ticks: {
              font: { size: 11 }
            }
          },
          y: {
            title: { 
              display: true, 
              text: '리오더 포인트',
              font: { size: 12 }
            },
            beginAtZero: true,
            ticks: {
              font: { size: 11 }
            }
          }
        },
        plugins: {
          title: { 
            display: false
          },
          legend: {
            labels: {
              font: { size: 11 }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const item = reorderData[context.dataIndex];
                return [
                  `SKU: ${item.sku}`,
                  `현재 재고: ${item.stock_on_hand}`,
                  `리오더 포인트: ${item.reorder_point}`,
                  `일평균 판매: ${item.avg_daily}`,
                  `공급일수: ${item.days_of_supply}일`
                ];
              }
            }
          }
        }
      }
    });

    // 3. 공급일수 분포
    const supplyDays = filteredInventory
      .filter((item: any) => item.days_of_supply !== null)
      .map((item: any) => Number(item.days_of_supply || 0));

    const supplyRanges = [
      { label: '0-7일', count: supplyDays.filter(d => d <= 7).length },
      { label: '8-14일', count: supplyDays.filter(d => d > 7 && d <= 14).length },
      { label: '15-30일', count: supplyDays.filter(d => d > 14 && d <= 30).length },
      { label: '30일+', count: supplyDays.filter(d => d > 30).length }
    ];

    ensureChart("chart-supply-days", {
      type: 'bar',
      data: {
        labels: supplyRanges.map(r => r.label),
        datasets: [{
          label: 'SKU 수',
          data: supplyRanges.map(r => r.count),
          backgroundColor: '#ff9f43',
          borderColor: '#ff8c00',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            beginAtZero: true, 
            title: { 
              display: true, 
              text: 'SKU 수',
              font: { size: 12 }
            },
            ticks: {
              font: { size: 11 }
            }
          },
          x: {
            ticks: {
              font: { size: 11 }
            }
          }
        },
        plugins: {
          title: { 
            display: false
          },
          legend: {
            labels: {
              font: { size: 11 }
            }
          }
        }
      }
    });

    // 4. 일평균 판매량 vs 재고
    const dailySales = filteredInventory
      .filter((item: any) => item.avg_daily !== null && item.stock_on_hand !== null)
      .map((item: any) => ({
        x: Number(item.avg_daily || 0),
        y: Number(item.stock_on_hand || 0)
      }));

    ensureChart("chart-daily-sales-vs-stock", {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'SKU',
          data: dailySales,
          backgroundColor: '#5f27cd',
          borderColor: '#4a1a8a',
          pointRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: { 
              display: true, 
              text: '일평균 판매량',
              font: { size: 12 }
            },
            beginAtZero: true,
            ticks: {
              font: { size: 11 }
            }
          },
          y: {
            title: { 
              display: true, 
              text: '현재 재고',
              font: { size: 12 }
            },
            beginAtZero: true,
            ticks: {
              font: { size: 11 }
            }
          }
        },
        plugins: {
          title: { 
            display: false
          },
          legend: {
            labels: {
              font: { size: 11 }
            }
          }
        }
      }
    });

  }, [filteredInventory, inventoryStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-[1500px] mx-auto p-4">
        <ErrorBanner message={errMsg} onClose={() => setErrMsg("")} />
        
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">재고 분석</h1>
              <p className="text-gray-600 mt-1">재고 수준, 리오더 포인트, 단종 후보 분석</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>

        {/* 기본 재고 통계 정보 */}
        {basicStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 SKU 수</p>
                  <p className="text-2xl font-bold text-gray-900">{basicStats.totalSkus.toLocaleString()}개</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 재고 가치</p>
                  <p className="text-2xl font-bold text-gray-900">₩{Math.round(basicStats.totalStockValue).toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">평균 재고 수준</p>
                  <p className="text-2xl font-bold text-gray-900">{basicStats.avgStockLevel.toLocaleString()}개</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">재고 회전율</p>
                  <p className="text-2xl font-bold text-gray-900">{basicStats.turnoverRate}회/일</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 필터 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">필터</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="SEOUL">서울</option>
                <option value="BUSAN">부산</option>
                <option value="DAEGU">대구</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">채널</label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="web">웹</option>
                <option value="mobile">모바일</option>
                <option value="offline">오프라인</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="Outer">아우터</option>
                <option value="Top">상의</option>
                <option value="Bottom">하의</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              📊 조회
            </button>
          </div>
        </div>

        {/* 재고 상태 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⚠️</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">긴급 리오더</h3>
                <p className="text-2xl font-bold text-red-600">{inventoryStats.urgent}개</p>
                <p className="text-sm text-gray-600">3일 이내 리오더 필요</p>
              </div>
            </div>
            {/* 긴급 리오더 인사이트 */}
            <div className="mt-4 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="flex items-start">
                <div className="text-red-600 mr-2">🚨</div>
                <div>
                  <div className="text-sm font-medium text-red-900 mb-1">긴급 재고 부족</div>
                  <div className="text-xs text-red-700">
                    즉시 발주가 필요한 상품입니다. 재고 부족으로 인한 매출 손실을 방지하기 위해 
                    우선적으로 처리하세요.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔍</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">리오더 검토</h3>
                <p className="text-2xl font-bold text-orange-600">{inventoryStats.review}개</p>
                <p className="text-sm text-gray-600">3-7일 내 검토 필요</p>
              </div>
            </div>
            {/* 리오더 검토 인사이트 */}
            <div className="mt-4 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <div className="flex items-start">
                <div className="text-orange-600 mr-2">🔍</div>
                <div>
                  <div className="text-sm font-medium text-orange-900 mb-1">재고 검토 필요</div>
                  <div className="text-xs text-orange-700">
                    곧 재고 부족이 예상되는 상품입니다. 판매 패턴을 분석하여 
                    적절한 발주 시점과 수량을 결정하세요.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">안정</h3>
                <p className="text-2xl font-bold text-green-600">{inventoryStats.stable}개</p>
                <p className="text-sm text-gray-600">7일 이상 여유</p>
              </div>
            </div>
            {/* 안정 상태 인사이트 */}
            <div className="mt-4 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-start">
                <div className="text-green-600 mr-2">✅</div>
                <div>
                  <div className="text-sm font-medium text-green-900 mb-1">재고 안정 상태</div>
                  <div className="text-xs text-green-700">
                    충분한 재고를 보유하고 있습니다. 정기적인 모니터링을 통해 
                    안정적인 재고 수준을 유지하세요.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📉</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">단종 후보</h3>
                <p className="text-2xl font-bold text-purple-600">{filteredEOL.length}개</p>
                <p className="text-sm text-gray-600">30일 무판매</p>
              </div>
            </div>
            {/* 단종 후보 인사이트 */}
            <div className="mt-4 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-start">
                <div className="text-purple-600 mr-2">📉</div>
                <div>
                  <div className="text-sm font-medium text-purple-900 mb-1">단종 검토 필요</div>
                  <div className="text-xs text-purple-700">
                    30일 이상 판매되지 않은 상품입니다. 마케팅 강화, 가격 조정, 
                    또는 단종을 고려해보세요.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 재고 상태별 SKU 수 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">재고 상태별 SKU 수</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-500">재고 분포</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-inventory-status"></canvas>
            </div>
            {/* 재고 상태 분포 설명 */}
            <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="flex items-start">
                <div className="text-red-600 mr-2">📊</div>
                <div>
                  <div className="text-sm font-medium text-red-900 mb-1">재고 상태 분포</div>
                  <div className="text-xs text-red-700">
                    긴급, 검토, 안정 상태별 SKU 수를 파이 차트로 확인하여 전체 재고 상황을 한눈에 파악할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 공급일수 분포 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">공급일수 분포</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-500">공급 기간</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-supply-days"></canvas>
            </div>
            {/* 공급일수 분포 설명 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start">
                <div className="text-blue-600 mr-2">📅</div>
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-1">공급일수 분포</div>
                  <div className="text-xs text-blue-700">
                    현재 재고로 얼마나 오래 공급할 수 있는지 히스토그램으로 확인하여 재고 수준의 적정성을 판단할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 리오더 포인트 vs 현재 재고 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">리오더 포인트 vs 현재 재고</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">재고 비교</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-reorder-vs-stock"></canvas>
            </div>
            {/* 리오더 포인트 비교 설명 */}
            <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-400">
              <div className="flex items-start">
                <div className="text-green-600 mr-2">⚖️</div>
                <div>
                  <div className="text-sm font-medium text-green-900 mb-1">리오더 포인트 비교</div>
                  <div className="text-xs text-green-700">
                    현재 재고와 리오더 포인트를 산점도로 비교하여 발주가 필요한 상품을 시각적으로 식별할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 일평균 판매량 vs 재고 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">일평균 판매량 vs 재고</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-xs text-gray-500">판매-재고 관계</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-daily-sales-vs-stock"></canvas>
            </div>
            {/* 판매량-재고 관계 설명 */}
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-400">
              <div className="flex items-start">
                <div className="text-purple-600 mr-2">📈</div>
                <div>
                  <div className="text-sm font-medium text-purple-900 mb-1">판매량-재고 관계</div>
                  <div className="text-xs text-purple-700">
                    일평균 판매량과 현재 재고의 관계를 확인하여 재고 회전율과 적정 재고 수준을 파악할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 재고 목록 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">재고 상세 목록</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일평균 판매</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재 재고</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리오더 포인트</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공급일수</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리오더 갭</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item: any, index: number) => {
                    const status = item.reorder_gap_days === null ? '데이터 없음' :
                      item.reorder_gap_days < 3 ? '긴급' :
                      item.reorder_gap_days < 7 ? '검토' : '안정';
                    
                    const statusColor = status === '긴급' ? 'text-red-600 bg-red-100' :
                      status === '검토' ? 'text-orange-600 bg-orange-100' :
                      status === '안정' ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100';

                    return (
                      <tr key={item.sku || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.avg_daily ? Number(item.avg_daily).toFixed(2) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.stock_on_hand ? Number(item.stock_on_hand).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.reorder_point ? Number(item.reorder_point).toFixed(0) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.days_of_supply ? Number(item.days_of_supply).toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.reorder_gap_days ? Number(item.reorder_gap_days).toFixed(1) : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 단종 후보 목록 */}
        {filteredEOL.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">단종 후보 SKU</h2>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">마지막 판매일</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">무판매 일수</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">현재 재고</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredEOL.map((item: any, index: number) => (
                      <tr key={item.sku || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.last_sale}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.days_since}일
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.stock_on_hand ? Number(item.stock_on_hand).toLocaleString() : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
