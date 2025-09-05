'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBanner from '@/components/ErrorBanner';
import { ensureChart, doughnutConfig, barConfig } from '@/lib/charts';
import { useRpc } from '@/lib/useRpc';

export default function ABCAnalysisPage() {
  const router = useRouter();
  const [errMsg, setErrMsg] = useState('');
  const [tenantId, setTenantId] = useState<string>('');
  
  // 실시간 동기화는 전역 IngestBridge에서 처리

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
          setTenantId('');
        }
      } catch (err) {
        console.error('Tenant ID 로드 실패:', err);
        setTenantId('');
      }
    };
    loadTenantId();
  }, []);

  // useRpc로 데이터 로딩 통일
  const { data: abcData, error: abcError, isLoading: abcLoading } = useRpc<any[]>(
    'board_abc_by_sku',
    tenantId ? {
      p_tenant_id: tenantId,
      p_from: '2025-01-01',
      p_to: '2025-12-31',
    } : null,
    [tenantId]
  );

  const { data: reorderData, error: reorderError, isLoading: reorderLoading } = useRpc<any[]>(
    'board_reorder_points',
    tenantId ? {
      p_tenant_id: tenantId,
      p_from: '2025-01-01',
      p_to: '2025-12-31',
      p_lead_time: 7,
      p_z_score: 1.65,
    } : null,
    [tenantId]
  );

  // 통합된 insights 데이터
  const insights = useMemo(() => {
    if (!tenantId) return null;
    
    return {
      ok: true,
      abcAnalysis: abcData || [],
      topSkus: [], // TODO: 별도 RPC 함수 필요
      categoryAnalysis: [], // TODO: 별도 RPC 함수 필요
      reorder: reorderData || [],
    };
  }, [tenantId, abcData, reorderData]);

  const error = abcError || reorderError;
  const loading = abcLoading || reorderLoading;

  // 조회 버튼 핸들러
  const handleApplyFilters = () => {
    setAppliedFilters({
      region,
      channel,
      category
    });
  };

  // ABC 데이터 필터링
  const filteredABC = useMemo(() => {
    if (!insights?.abcAnalysis) return [];
    
    return insights.abcAnalysis.filter((item: any) => {
      if (appliedFilters.region && item.region !== appliedFilters.region) return false;
      if (appliedFilters.channel && item.channel !== appliedFilters.channel) return false;
      if (appliedFilters.category && item.category !== appliedFilters.category) return false;
      return true;
    });
  }, [insights, appliedFilters]);

  // ABC 그룹별 통계
  const abcStats = useMemo(() => {
    const groups: { A: any[], B: any[], C: any[] } = { A: [], B: [], C: [] };
    filteredABC.forEach((item: any) => {
      if (groups[item.grade as keyof typeof groups]) {
        groups[item.grade as keyof typeof groups].push(item);
      }
    });

    const totalRevenue = filteredABC.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
    
    return {
      A: {
        count: groups.A.length,
        revenue: groups.A.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0),
        percentage: totalRevenue > 0 ? (groups.A.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0) / totalRevenue * 100).toFixed(1) : 0
      },
      B: {
        count: groups.B.length,
        revenue: groups.B.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0),
        percentage: totalRevenue > 0 ? (groups.B.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0) / totalRevenue * 100).toFixed(1) : 0
      },
      C: {
        count: groups.C.length,
        revenue: groups.C.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0),
        percentage: totalRevenue > 0 ? (groups.C.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0) / totalRevenue * 100).toFixed(1) : 0
      }
    };
  }, [filteredABC]);

  // 차트 렌더링
  useEffect(() => {
    if (!filteredABC.length) return;

    // 1. ABC 분석 도넛 차트
    const pieData = [
      abcStats.A.revenue,
      abcStats.B.revenue,
      abcStats.C.revenue
    ];

    ensureChart("chart-abc-doughnut", {
      type: 'doughnut',
      data: {
        labels: ["A그룹 (80%)", "B그룹 (15%)", "C그룹 (5%)"],
        datasets: [{
          data: pieData,
          backgroundColor: ['#ff6b6b', '#ffa726', '#66bb6a'],
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
              },
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets && data.datasets.length) {
                  return data.labels.map((label: any, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = (dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                    
                    return {
                      text: `${label}: ${value.toLocaleString()}원 (${percentage}%)`,
                      fillStyle: (dataset.backgroundColor as any[])[i],
                      strokeStyle: Array.isArray(dataset.borderColor) ? (dataset.borderColor as any[])[i] : (dataset.borderColor as string),
                      lineWidth: dataset.borderWidth as number,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          }
        }
      }
    });

    // 2. ABC 그룹별 SKU 수
    ensureChart("chart-abc-count", {
      type: 'bar',
      data: {
        labels: ['A그룹', 'B그룹', 'C그룹'],
        datasets: [{
          label: 'SKU 수',
          data: [abcStats.A.count, abcStats.B.count, abcStats.C.count],
          backgroundColor: ['#ff6b6b', '#ffa726', '#66bb6a'],
          borderColor: ['#e74c3c', '#f39c12', '#27ae60'],
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

    // 3. 파레토 차트 (누적 매출 비중)
    const sortedABC = [...filteredABC].sort((a, b) => Number(b.revenue || 0) - Number(a.revenue || 0));
    const cumulativeData: Array<{
      sku: string;
      revenue: number;
      cumulative: string;
    }> = [];
    let cumulative = 0;
    const totalRevenue = sortedABC.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
    
    sortedABC.forEach((item, index) => {
      cumulative += Number(item.revenue || 0);
      cumulativeData.push({
        sku: item.sku,
        revenue: Number(item.revenue || 0),
        cumulative: (cumulative / totalRevenue * 100).toFixed(1)
      });
    });

    const top20 = sortedABC.slice(0, Math.min(20, sortedABC.length));
    
    ensureChart("chart-pareto", {
      type: 'bar',
      data: {
        labels: top20.map(item => item.sku),
        datasets: [
          {
            label: '매출',
            data: top20.map(item => Number(item.revenue || 0)),
            backgroundColor: '#4ecdc4',
            borderColor: '#45b7d1',
            borderWidth: 1,
            yAxisID: 'y'
          },
          {
            label: '누적 비중 (%)',
            data: top20.map((_, index) => {
              const cumulative = top20.slice(0, index + 1).reduce((sum, item) => sum + Number(item.revenue || 0), 0);
              return Number((cumulative / totalRevenue * 100).toFixed(1));
            }),
            type: 'line',
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            yAxisID: 'y1',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { 
              display: true, 
              text: '매출',
              font: { size: 12 }
            },
            ticks: {
              font: { size: 11 }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { 
              display: true, 
              text: '누적 비중 (%)',
              font: { size: 12 }
            },
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            ticks: {
              font: { size: 11 }
            }
          },
          x: {
            ticks: {
              font: { size: 10 },
              maxRotation: 45,
              minRotation: 0
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

  }, [filteredABC, abcStats]);

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
              <h1 className="text-2xl font-bold text-gray-900">ABC 분석</h1>
              <p className="text-gray-600 mt-1">SKU별 매출 비중 분석 및 파레토 차트</p>
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
          <div className="mt-4">
            <button 
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm"
            >
              📊 조회
            </button>
          </div>
        </div>

        {/* ABC 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">A</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">A그룹</h3>
                <p className="text-2xl font-bold text-red-600">{abcStats.A.count}개 SKU</p>
                <p className="text-sm text-gray-600">{abcStats.A.percentage}% (매출 비중)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">B</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">B그룹</h3>
                <p className="text-2xl font-bold text-orange-600">{abcStats.B.count}개 SKU</p>
                <p className="text-sm text-gray-600">{abcStats.B.percentage}% (매출 비중)</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">C</span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">C그룹</h3>
                <p className="text-2xl font-bold text-green-600">{abcStats.C.count}개 SKU</p>
                <p className="text-sm text-gray-600">{abcStats.C.percentage}% (매출 비중)</p>
              </div>
            </div>
          </div>
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ABC 분석 도넛 차트 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">ABC 분석 도넛 차트</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-gray-500">매출 비중</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-abc-doughnut"></canvas>
            </div>
            {/* ABC 분석 설명 */}
            <div className="mt-3 p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
              <div className="flex items-start">
                <div className="text-red-600 mr-2">📊</div>
                <div>
                  <div className="text-sm font-medium text-red-900 mb-1">ABC 분석</div>
                  <div className="text-xs text-red-700">
                    매출 비중에 따라 상품을 A(80%), B(15%), C(5%) 그룹으로 분류하여 
                    우선순위를 정하고 관리 전략을 수립할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ABC 그룹별 SKU 수 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">ABC 그룹별 SKU 수</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-xs text-gray-500">상품 수</span>
              </div>
            </div>
            <div className="h-48">
              <canvas id="chart-abc-count"></canvas>
            </div>
            {/* ABC 그룹별 SKU 수 설명 */}
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
              <div className="flex items-start">
                <div className="text-orange-600 mr-2">📈</div>
                <div>
                  <div className="text-sm font-medium text-orange-900 mb-1">그룹별 상품 수</div>
                  <div className="text-xs text-orange-700">
                    각 ABC 그룹에 속한 SKU의 개수를 확인하여 상품 포트폴리오의 
                    집중도를 파악할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 파레토 차트 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">파레토 차트 (TOP 20 SKU)</h3>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-xs text-gray-500">80-20 법칙</span>
              </div>
            </div>
            <div className="h-64">
              <canvas id="chart-pareto"></canvas>
            </div>
            {/* 파레토 차트 설명 */}
            <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
              <div className="flex items-start">
                <div className="text-blue-600 mr-2">📊</div>
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-1">파레토 차트 (80-20 법칙)</div>
                  <div className="text-xs text-blue-700">
                    상위 20%의 상품이 전체 매출의 80%를 차지하는지 확인하여 
                    핵심 상품에 집중할 수 있는지 판단할 수 있습니다.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ABC 그룹별 상세 SKU 목록 */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">ABC 그룹별 상세 SKU 목록</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* A그룹 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-red-600 mb-4">A그룹 SKU</h3>
              <div className="space-y-2">
                {filteredABC
                  .filter((item: any) => item.grade === 'A')
                  .sort((a: any, b: any) => Number(b.revenue || 0) - Number(a.revenue || 0))
                  .map((item: any, index: number) => (
                    <div key={item.sku} className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-sm text-gray-600">
                        {Number(item.revenue || 0).toLocaleString()}원
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* B그룹 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-orange-600 mb-4">B그룹 SKU</h3>
              <div className="space-y-2">
                {filteredABC
                  .filter((item: any) => item.grade === 'B')
                  .sort((a: any, b: any) => Number(b.revenue || 0) - Number(a.revenue || 0))
                  .map((item: any, index: number) => (
                    <div key={item.sku} className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-sm text-gray-600">
                        {Number(item.revenue || 0).toLocaleString()}원
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* C그룹 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-green-600 mb-4">C그룹 SKU</h3>
              <div className="space-y-2">
                {filteredABC
                  .filter((item: any) => item.grade === 'C')
                  .sort((a: any, b: any) => Number(b.revenue || 0) - Number(a.revenue || 0))
                  .map((item: any, index: number) => (
                    <div key={item.sku} className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="font-medium">{item.sku}</span>
                      <span className="text-sm text-gray-600">
                        {Number(item.revenue || 0).toLocaleString()}원
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
