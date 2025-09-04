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

  // 필터 상태
  const [region, setRegion] = useState('');
  const [channel, setChannel] = useState('');
  const [category, setCategory] = useState('');

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/board/insights?tenant_id=84949b3c-2cb7-4c42-b9f9-d1f37d371e00&from=2025-01-01&to=2025-12-31&lead_time=7&z=1.65');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setInsights(json);
      } catch (err) {
        setErrMsg(`데이터 로드 실패: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 재고 관련 데이터 필터링
  const filteredInventory = useMemo(() => {
    if (!insights?.reorder) return [];
    
    return insights.reorder.filter((item: any) => {
      if (region && item.region !== region) return false;
      if (channel && item.channel !== channel) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  }, [insights, region, channel, category]);

  // EOL 후보 데이터 필터링
  const filteredEOL = useMemo(() => {
    if (!insights?.eol) return [];
    
    return insights.eol.filter((item: any) => {
      if (region && item.region !== region) return false;
      if (channel && item.channel !== channel) return false;
      if (category && item.category !== category) return false;
      return true;
    });
  }, [insights, region, channel, category]);

  // 재고 상태별 통계
  const inventoryStats = useMemo(() => {
    const urgent = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days < 3
    );
    const review = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days >= 3 && item.reorder_gap_days < 7
    );
    const stable = filteredInventory.filter((item: any) => 
      item.reorder_gap_days !== null && item.reorder_gap_days >= 7
    );

    return {
      urgent: urgent.length,
      review: review.length,
      stable: stable.length,
      total: filteredInventory.length
    };
  }, [filteredInventory]);

  // 차트 렌더링
  useEffect(() => {
    if (!filteredInventory.length) return;

    // 1. 재고 상태별 SKU 수
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
        plugins: {
          title: {
            display: true,
            text: `재고 상태별 SKU 분포 (총 ${inventoryStats.total}개)`
          },
          legend: {
            position: 'bottom'
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
        scales: {
          x: {
            title: { display: true, text: '현재 재고' },
            beginAtZero: true
          },
          y: {
            title: { display: true, text: '리오더 포인트' },
            beginAtZero: true
          }
        },
        plugins: {
          title: { display: true, text: '리오더 포인트 vs 현재 재고' },
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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'SKU 수' } }
        },
        plugins: {
          title: { display: true, text: '공급일수 분포' }
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
        scales: {
          x: {
            title: { display: true, text: '일평균 판매량' },
            beginAtZero: true
          },
          y: {
            title: { display: true, text: '현재 재고' },
            beginAtZero: true
          }
        },
        plugins: {
          title: { display: true, text: '일평균 판매량 vs 현재 재고' }
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
          </div>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 재고 상태별 SKU 수 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-inventory-status" height="300"></canvas>
          </div>

          {/* 공급일수 분포 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-supply-days" height="300"></canvas>
          </div>

          {/* 리오더 포인트 vs 현재 재고 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-reorder-vs-stock" height="300"></canvas>
          </div>

          {/* 일평균 판매량 vs 재고 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-daily-sales-vs-stock" height="300"></canvas>
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
