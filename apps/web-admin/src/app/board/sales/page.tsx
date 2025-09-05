'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import ErrorBanner from '@/components/ErrorBanner';
import { ensureChart, lineConfig, barConfig, scatterConfig } from '@/lib/charts';

export default function SalesAnalysisPage() {
  const router = useRouter();
  const [errMsg, setErrMsg] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');

  // 필터 상태
  const [region, setRegion] = useState('');
  const [channel, setChannel] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');
  const [period, setPeriod] = useState('1year'); // 기간 선택
  const [appliedFilters, setAppliedFilters] = useState({
    region: '',
    channel: '',
    category: '',
    sku: ''
  });

  // 기간별 날짜 계산
  const getDateRange = (period: string) => {
    const today = new Date();
    const to = today.toISOString().split('T')[0];
    
    switch (period) {
      case '1month':
        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);
        return { from: oneMonthAgo.toISOString().split('T')[0], to };
      case '3months':
        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        return { from: threeMonthsAgo.toISOString().split('T')[0], to };
      case '6months':
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(today.getMonth() - 6);
        return { from: sixMonthsAgo.toISOString().split('T')[0], to };
      case '1year':
      default:
        return { from: '2025-01-01', to: '2025-12-31' };
    }
  };

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

  // 데이터 로드
  useEffect(() => {
    if (!tenantId) return; // tenant_id가 없으면 대기
    
    const loadData = async () => {
      try {
        setLoading(true);
        const { from, to } = getDateRange(period);
        const response = await fetch(`/api/board/charts?from=${from}&to=${to}&tenant_id=${tenantId}`);
        if (!response.ok) {
          if (response.status === 400) {
            console.log('📊 데이터가 없습니다. 빈 데이터로 초기화합니다.');
            setData({
              ok: true,
              salesDaily: [],
              roasByChannel: [],
              topCategories: [],
              topRegions: [],
              topSkus: [],
              cumulativeRevenue: [],
              tempVsSales: [],
              spendRevDaily: []
            });
            return;
          }
          throw new Error(`HTTP ${response.status}`);
        }
        const json = await response.json();
        console.log('🔍 Debug - API Response:', json);
        console.log('🔍 Debug - API salesDaily[0]:', json.salesDaily?.[0]);
        setData(json);
      } catch (err) {
        console.error('데이터 로드 에러:', err);
        setData({
          ok: true,
          salesDaily: [],
          roasByChannel: [],
          topCategories: [],
          topRegions: [],
          topSkus: [],
          cumulativeRevenue: [],
          tempVsSales: [],
          spendRevDaily: []
        });
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [period, tenantId]);

  // 조회 버튼 핸들러
  const handleApplyFilters = async () => {
    if (!tenantId) return;
    
    try {
      setLoading(true);
      const { from, to } = getDateRange(period);
      const response = await fetch(`/api/board/charts?from=${from}&to=${to}&tenant_id=${tenantId}&region=${region}&channel=${channel}&category=${category}&sku=${sku}`);
      if (!response.ok) {
        if (response.status === 400) {
          console.log('📊 필터링된 데이터가 없습니다.');
          setData({
            ok: true,
            salesDaily: [],
            roasByChannel: [],
            topCategories: [],
            topRegions: [],
            topSkus: [],
            cumulativeRevenue: [],
            tempVsSales: [],
            spendRevDaily: []
          });
          return;
        }
        throw new Error(`HTTP ${response.status}`);
      }
      const json = await response.json();
      setData(json);
    } catch (err) {
      console.error('필터링 데이터 로드 에러:', err);
      setData({
        ok: true,
        salesDaily: [],
        roasByChannel: [],
        topCategories: [],
        topRegions: [],
        topSkus: [],
        cumulativeRevenue: [],
        tempVsSales: [],
        spendRevDaily: []
      });
    } finally {
      setLoading(false);
    }
    
    setAppliedFilters({
      region,
      channel,
      category,
      sku
    });
  };

  // 클라이언트 필터링
  const applyClientFilters = (rawData: any) => {
    if (!rawData) return rawData;
    
    const filter = (arr: any[]) => {
      if (!Array.isArray(arr)) return arr;
      return arr.filter((item: any) => {
        if (appliedFilters.region && item.region !== appliedFilters.region) return false;
        if (appliedFilters.channel && item.channel !== appliedFilters.channel) return false;
        if (appliedFilters.category && item.category !== appliedFilters.category) return false;
        if (appliedFilters.sku && item.sku !== appliedFilters.sku) return false;
        return true;
      });
    };

    return {
      ...rawData,
      salesDaily: filter(rawData.salesDaily || []),
      roasByChannel: filter(rawData.roasByChannel || []),
      topCategories: filter(rawData.topCategories || []),
      topRegions: filter(rawData.topRegions || []),
      topSkus: filter(rawData.topSkus || []),
      spendRevDaily: filter(rawData.spendRevDaily || []),
      tempVsSales: filter(rawData.tempVsSales || [])
    };
  };

  const filteredData = useMemo(() => applyClientFilters(data), [data, appliedFilters]);

  // 기본 통계 정보 계산
  const calculateStats = (data: any) => {
    if (!data) return null;
    
    const salesDaily = data.salesDaily || [];
    const totalRevenue = salesDaily.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
    const totalQuantity = salesDaily.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0);
    const totalOrders = salesDaily.reduce((sum: number, item: any) => sum + Number(item.orders || 0), 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // 고유 SKU 수
    const uniqueSkus = new Set(salesDaily.map((item: any) => item.sku)).size;
    
    // 고유 지역 수
    const uniqueRegions = new Set(salesDaily.map((item: any) => item.region)).size;
    
    // 고유 채널 수
    const uniqueChannels = new Set(salesDaily.map((item: any) => item.channel)).size;
    
    return {
      totalRevenue,
      totalQuantity,
      totalOrders,
      avgOrderValue,
      uniqueSkus,
      uniqueRegions,
      uniqueChannels
    };
  };

  const stats = calculateStats(filteredData);

  // 차트 렌더링
  useEffect(() => {
    if (!filteredData) return;

    // 1. 일자별 매출 추이 - 기간에 따라 데이터 포인트 조정
    const salesData = filteredData.salesDaily || [];
    let processedSalesData = salesData;
    
    // 기간에 따라 데이터 포인트 수 조정
    if (period === '1year' && salesData.length > 30) {
      // 1년 데이터는 주간 단위로 집계
      const weeklyData = new Map();
      salesData.forEach((item: any) => {
        const date = new Date(item.sale_date);
        const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            sale_date: weekKey,
            revenue: 0,
            qty: 0,
            orders: 0
          });
        }
        const weekData = weeklyData.get(weekKey);
        weekData.revenue += Number(item.revenue || 0);
        weekData.qty += Number(item.qty || 0);
        weekData.orders += Number(item.orders || 0);
      });
      processedSalesData = Array.from(weeklyData.values()).sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    } else if (period === '6months' && salesData.length > 20) {
      // 6개월 데이터는 3일 단위로 집계
      const threeDayData = new Map();
      salesData.forEach((item: any) => {
        const date = new Date(item.sale_date);
        const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const threeDayKey = `${date.getFullYear()}-${Math.floor(dayOfYear / 3)}`;
        if (!threeDayData.has(threeDayKey)) {
          threeDayData.set(threeDayKey, {
            sale_date: threeDayKey,
            revenue: 0,
            qty: 0,
            orders: 0
          });
        }
        const threeDayItem = threeDayData.get(threeDayKey);
        threeDayItem.revenue += Number(item.revenue || 0);
        threeDayItem.qty += Number(item.qty || 0);
        threeDayItem.orders += Number(item.orders || 0);
      });
      processedSalesData = Array.from(threeDayData.values()).sort((a, b) => a.sale_date.localeCompare(b.sale_date));
    }
    
    const salesLabels = processedSalesData.map((d: any) => d.sale_date);
    const salesValues = processedSalesData.map((d: any) => Number(d.revenue || 0));
    const qtyValues = processedSalesData.map((d: any) => Number(d.qty || 0));

    ensureChart("chart-sales-trend", {
      type: 'line',
      data: {
        labels: salesLabels,
        datasets: [
          {
            label: '매출',
            data: salesValues,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: '판매량',
            data: qtyValues,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            pointRadius: 3
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
              font: { size: 11 }
            },
            ticks: {
              font: { size: 10 }
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { 
              display: true, 
              text: '판매량',
              font: { size: 11 }
            },
            ticks: {
              font: { size: 10 }
            },
            grid: { drawOnChartArea: false }
          },
          x: {
            ticks: {
              maxTicksLimit: period === '1year' ? 12 : period === '6months' ? 8 : 15,
              font: { size: 10 }
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

    // 2. 채널별 ROAS
    const roasData = filteredData.roasByChannel || [];
    ensureChart("chart-roas-by-channel", {
      type: 'bar',
      data: {
        labels: roasData.map((d: any) => d.channel),
        datasets: [{
          label: 'ROAS',
          data: roasData.map((d: any) => Number(d.avg_roas || 0)),
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
              text: 'ROAS',
              font: { size: 11 }
            },
            ticks: {
              font: { size: 10 }
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

    // 3. 카테고리별 매출 비중
    const categoryData = filteredData.topCategories || [];
    ensureChart("chart-category-revenue", {
      type: 'doughnut',
      data: {
        labels: categoryData.map((d: any) => d.category),
        datasets: [{
          data: categoryData.map((d: any) => Number(d.revenue || 0)),
          backgroundColor: [
            '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
            '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'
          ]
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
              font: { size: 11 }
            }
          }
        }
      }
    });

    // 4. 지역별 매출
    const regionData = filteredData.topRegions || [];
    ensureChart("chart-region-revenue", {
      type: 'bar',
      data: {
        labels: regionData.map((d: any) => d.region),
        datasets: [{
          label: '매출',
          data: regionData.map((d: any) => Number(d.revenue || 0)),
          backgroundColor: '#10ac84',
          borderColor: '#0d8a6b',
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
              text: '매출',
              font: { size: 11 }
            },
            ticks: {
              font: { size: 10 }
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

    // 5. TOP SKU 매출
    const skuData = filteredData.topSkus || [];
    ensureChart("chart-top-skus", {
      type: 'bar',
      data: {
        labels: skuData.map((d: any) => d.sku),
        datasets: [{
          label: '매출',
          data: skuData.map((d: any) => Number(d.revenue || 0)),
          backgroundColor: '#5f27cd',
          borderColor: '#4a1a8a',
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
              text: '매출',
              font: { size: 11 }
            },
            ticks: {
              font: { size: 10 }
            }
          },
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: { size: 10 }
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

  }, [filteredData, period]);

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
              <h1 className="text-2xl font-bold text-gray-900">판매 분석</h1>
              <p className="text-gray-600 mt-1">매출, 판매량, 채널별 성과 분석</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              ← 뒤로가기
            </button>
          </div>
        </div>

        {/* 데이터 상태 표시 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${(data?.salesDaily?.length || 0) > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="text-sm font-medium text-gray-700">
                {(data?.salesDaily?.length || 0) > 0 ? '데이터 있음' : '데이터 없음'}
              </span>
            </div>
            {(data?.salesDaily?.length || 0) > 0 && (
              <div className="text-xs text-gray-500">
                {data?.salesDaily?.length || 0}행 | {new Date().toLocaleString('ko-KR')}
              </div>
            )}
          </div>
          {(data?.salesDaily?.length || 0) === 0 && (
            <div className="mt-2 text-xs text-gray-600">
              메인 페이지에서 CSV 파일을 업로드하여 데이터를 분석하세요.
            </div>
          )}
        </div>

        {/* 기본 통계 정보 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 매출</p>
                  <p className="text-2xl font-bold text-gray-900">₩{stats.totalRevenue.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 판매량</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalQuantity.toLocaleString()}개</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">총 주문수</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders.toLocaleString()}건</p>
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
                  <p className="text-sm font-medium text-gray-600">평균 주문가</p>
                  <p className="text-2xl font-bold text-gray-900">₩{Math.round(stats.avgOrderValue).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 기간 선택 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">분석 기간</h3>
          <div className="flex gap-2">
            {[
              { value: '1month', label: '1개월' },
              { value: '3months', label: '3개월' },
              { value: '6months', label: '6개월' },
              { value: '1year', label: '1년' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPeriod(option.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  period === option.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">필터</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
              <select
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
              >
                <option value="">전체</option>
                <option value="SKU-001">SKU-001</option>
                <option value="SKU-002">SKU-002</option>
                <option value="SKU-003">SKU-003</option>
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

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 일자별 매출 추이 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-sales-trend" className="h-64"></canvas>
          </div>

          {/* 채널별 ROAS */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-roas-by-channel" className="h-48"></canvas>
          </div>

          {/* 카테고리별 매출 비중 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-category-revenue" className="h-48"></canvas>
          </div>

          {/* 지역별 매출 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-region-revenue" className="h-48"></canvas>
          </div>

          {/* TOP SKU 매출 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
            <canvas id="chart-top-skus" className="h-64"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
