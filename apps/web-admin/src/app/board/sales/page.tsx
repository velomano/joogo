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

  // 필터 상태
  const [region, setRegion] = useState('');
  const [channel, setChannel] = useState('');
  const [category, setCategory] = useState('');
  const [sku, setSku] = useState('');

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/board/charts?from=2025-01-01&to=2025-12-31&tenant_id=84949b3c-2cb7-4c42-b9f9-d1f37d371e00');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setErrMsg(`데이터 로드 실패: ${err}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 클라이언트 필터링
  const applyClientFilters = (rawData: any) => {
    if (!rawData) return rawData;
    
    const filter = (arr: any[]) => {
      if (!Array.isArray(arr)) return arr;
      return arr.filter((item: any) => {
        if (region && item.region !== region) return false;
        if (channel && item.channel !== channel) return false;
        if (category && item.category !== category) return false;
        if (sku && item.sku !== sku) return false;
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

  const filteredData = useMemo(() => applyClientFilters(data), [data, region, channel, category, sku]);

  // 차트 렌더링
  useEffect(() => {
    if (!filteredData) return;

    // 1. 일자별 매출 추이
    const salesData = filteredData.salesDaily || [];
    const salesLabels = salesData.map((d: any) => d.sale_date);
    const salesValues = salesData.map((d: any) => Number(d.revenue || 0));
    const qtyValues = salesData.map((d: any) => Number(d.qty || 0));

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
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: '매출' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: '판매량' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          title: { display: true, text: '일자별 매출 및 판매량 추이' }
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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'ROAS' } }
        },
        plugins: {
          title: { display: true, text: '채널별 ROAS' }
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
        plugins: {
          title: { display: true, text: '카테고리별 매출 비중' },
          legend: { position: 'bottom' }
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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '매출' } }
        },
        plugins: {
          title: { display: true, text: '지역별 매출' }
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
        scales: {
          y: { beginAtZero: true, title: { display: true, text: '매출' } }
        },
        plugins: {
          title: { display: true, text: 'TOP SKU 매출' }
        }
      }
    });

  }, [filteredData]);

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
        </div>

        {/* 차트 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 일자별 매출 추이 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-sales-trend" height="300"></canvas>
          </div>

          {/* 채널별 ROAS */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-roas-by-channel" height="300"></canvas>
          </div>

          {/* 카테고리별 매출 비중 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-category-revenue" height="300"></canvas>
          </div>

          {/* 지역별 매출 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <canvas id="chart-region-revenue" height="300"></canvas>
          </div>

          {/* TOP SKU 매출 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 lg:col-span-2">
            <canvas id="chart-top-skus" height="300"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
}
