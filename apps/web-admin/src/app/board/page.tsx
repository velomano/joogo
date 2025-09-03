'use client';

import { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// 유틸리티 함수들
const parseCSVFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => resolve(result.data),
      error: reject
    });
  });
};

const parseCSVString = (csvString: string): any[] => {
  return Papa.parse(csvString, { header: true, skipEmptyLines: true }).data;
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const trimRows = (rows: any[]): any[] => {
  return rows.map(row => {
    const trimmed: any = {};
    for (const key in row) {
      trimmed[key.trim()] = typeof row[key] === 'string' ? row[key].trim() : row[key];
    }
    if (trimmed.date) {
      trimmed.date = formatDate(trimmed.date);
    }
    return trimmed;
  });
};

const toNum = (value: any): number | undefined => {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(String(value).replaceAll(',', ''));
  return Number.isFinite(num) ? num : undefined;
};

const sum = (arr: any[], selector: (item: any) => number | undefined): number => {
  return arr.reduce((acc, item) => acc + (selector(item) || 0), 0);
};

const groupBy = (arr: any[], keySelector: (item: any) => string) => {
  const map = new Map();
  arr.forEach(item => {
    const key = keySelector(item);
    const group = map.get(key) || [];
    group.push(item);
    map.set(key, group);
  });
  return map;
};

const unique = (arr: any[]): any[] => {
  return [...new Set(arr)].filter(Boolean).sort();
};

const movingAverage = (arr: number[], window: number): number[] => {
  const result: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = arr.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
};

// 디바운스 함수
const debounce = (func: Function, wait: number) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: any[]) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

interface SalesData {
  date: string;
  region: string;
  channel: string;
  sku: string;
  category: string;
  segment: string;
  qty: number;
  unit_price: number;
  discount_rate: number;
  unit_cost: number;
  revenue: number;
  tavg: number;
  tmax: number;
  tmin: number;
  precipitation: number;
  spend: number;
  clicks_mkt: number;
  impr_mkt: number;
  section: string;
  slot_rank: number;
  impr_merch: number;
  clicks_merch: number;
  campaign: string;
  platform: string;
  is_event: number;
  stock_on_hand: number;
  lead_time_days: number;
  profit: number;
}

export default function BoardPage() {
  const [rows, setRows] = useState<SalesData[]>([]);
  const [view, setView] = useState<SalesData[]>([]);
  const [charts, setCharts] = useState<{ [key: string]: any }>({});
  const [toggleMode, setToggleMode] = useState<'channel' | 'region' | 'campaign'>('channel');
  const [scale, setScale] = useState(85);
  const [error, setError] = useState<string | null>(null);
  
  // 필터 상태
  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    region: '',
    channel: '',
    category: '',
    sku: ''
  });

  // 필터 옵션들
  const [filterOptions, setFilterOptions] = useState({
    regions: [] as string[],
    channels: [] as string[],
    categories: [] as string[],
    skus: [] as string[]
  });

  // KPI 상태
  const [kpis, setKpis] = useState({
    rows: 0,
    revenue: 0,
    spend: 0,
    roas: 0
  });

  // 품질 배지 상태
  const [qualityBadges, setQualityBadges] = useState({
    matchRate: 0,
    missingRate: 0
  });

  // 파일 업로드 핸들러
  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      const data = await parseCSVFile(file);
      const trimmed = trimRows(data);
      setRows(trimmed);
      refreshFilters(trimmed);
    } catch (err) {
      setError(`파일 업로드 실패: ${err}`);
    }
  }, []);

  // 샘플 데이터 로드
  const loadSampleData = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/sample_unified_board.csv');
      const csvText = await response.text();
      const data = parseCSVString(csvText);
      const trimmed = trimRows(data);
      setRows(trimmed);
      refreshFilters(trimmed);
      alert('샘플을 불러왔습니다. HTML과 같은 폴더에 CSV를 두세요.');
    } catch (err) {
      setError(`샘플 로드 실패: ${err}`);
    }
  }, []);

  // 필터 새로고침
  const refreshFilters = useCallback((data: SalesData[]) => {
    const allDates = unique(data.map(r => r.date));
    const regions = unique(data.map(r => r.region));
    const channels = unique(data.map(r => r.channel));
    const categories = unique(data.map(r => r.category));
    const skus = unique(data.map(r => r.sku));

    setFilterOptions({
      regions,
      channels,
      categories,
      skus
    });

    setFilters(prev => ({
      ...prev,
      fromDate: allDates[0] || '',
      toDate: allDates[allDates.length - 1] || ''
    }));
  }, []);

  // 필터 적용
  const applyFilters = useCallback((data: SalesData[]) => {
    const filtered = data.filter(row => {
      if (filters.fromDate && row.date < filters.fromDate) return false;
      if (filters.toDate && row.date > filters.toDate) return false;
      if (filters.region && row.region !== filters.region) return false;
      if (filters.channel && row.channel !== filters.channel) return false;
      if (filters.category && row.category !== filters.category) return false;
      if (filters.sku && row.sku !== filters.sku) return false;
      return true;
    });

    // 파생값 계산
    const processed = filtered.map(row => ({
      ...row,
      qty: toNum(row.qty) || 0,
      unit_price: toNum(row.unit_price) || 0,
      discount_rate: toNum(row.discount_rate) || 0,
      unit_cost: toNum(row.unit_cost) || 0,
      revenue: row.revenue !== undefined && row.revenue !== '' 
        ? toNum(row.revenue) || 0
        : (toNum(row.qty) || 0) * (toNum(row.unit_price) || 0) * (1 - (toNum(row.discount_rate) || 0)),
      tavg: toNum(row.tavg) || 0,
      spend: toNum(row.spend) || 0,
      slot_rank: toNum(row.slot_rank) || 0,
      is_event: Number(row.is_event) || 0,
      profit: 0
    })).map(row => ({
      ...row,
      profit: row.revenue - (row.unit_cost * row.qty)
    }));

    setView(processed);
  }, [filters]);

  // KPI 업데이트
  const updateKPIs = useCallback((data: SalesData[]) => {
    const totalRevenue = sum(data, r => r.revenue);
    const totalSpend = sum(data, r => r.spend);
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    setKpis({
      rows: data.length,
      revenue: totalRevenue,
      spend: totalSpend,
      roas
    });
  }, []);

  // 품질 배지 업데이트
  const updateQualityBadges = useCallback((data: SalesData[]) => {
    const total = data.length || 1;
    const keyOk = data.filter(r => 
      r.date && r.region && r.channel && r.sku && Number.isFinite(r.qty)
    ).length;
    const matchRate = Math.round(100 * keyOk / total);
    const missingRate = Math.round(100 * (total - keyOk) / total);

    setQualityBadges({
      matchRate,
      missingRate
    });
  }, []);

  // 차트 데이터 생성
  const generateChartData = useCallback((data: SalesData[]) => {
    const byDate = groupBy(data, r => r.date);
    const dates = [...byDate.keys()].sort();
    
    const dailyData = dates.map(date => {
      const dayData = byDate.get(date);
      return {
        date,
        qty: sum(dayData, r => r.qty),
        revenue: sum(dayData, r => r.revenue),
        spend: sum(dayData, r => r.spend),
        tavg: dayData.find(r => r.tavg !== undefined)?.tavg || 0,
        is_event: dayData.some(r => r.is_event === 1) ? 1 : 0
      };
    });

    return dailyData;
  }, []);

  // 리빌드 (디바운스 적용)
  const rebuild = useCallback(() => {
    if (!rows.length) {
      setView([]);
      setKpis({ rows: 0, revenue: 0, spend: 0, roas: 0 });
      setQualityBadges({ matchRate: 0, missingRate: 0 });
      return;
    }

    applyFilters(rows);
  }, [rows, applyFilters]);

  const debouncedRebuild = useCallback(debounce(rebuild, 200), [rebuild]);

  // 필터 변경 시 리빌드
  useEffect(() => {
    debouncedRebuild();
  }, [filters, debouncedRebuild]);

  // 뷰 변경 시 KPI 및 품질 배지 업데이트
  useEffect(() => {
    updateKPIs(view);
    updateQualityBadges(view);
  }, [view, updateKPIs, updateQualityBadges]);

  // CSV 내보내기
  const exportCSV = useCallback(() => {
    if (!view.length) return;

    const headers = Object.keys(view[0]);
    const csvContent = [
      headers.join(','),
      ...view.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sales_data_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [view]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* 에러 배너 */}
      {error && (
        <div className="bg-red-600 text-white p-4 text-center">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex">
        {/* 사이드바 */}
        <aside className="w-64 bg-gray-800 p-4 h-screen overflow-y-auto">
          <h1 className="text-xl font-bold mb-2">판매 실적 BOARD</h1>
          <p className="text-gray-400 text-sm mb-4">단일 CSV 업로드 또는 샘플 로드</p>
          
          {/* 파일 업로드 */}
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            className="w-full mb-4 p-2 bg-gray-700 border border-gray-600 rounded"
          />
          
          {/* 버튼들 */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={loadSampleData}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm"
            >
              샘플 불러오기
            </button>
            <button
              onClick={() => {
                setRows([]);
                setView([]);
                setError(null);
              }}
              className="px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded text-sm"
            >
              초기화
            </button>
          </div>

          <hr className="border-gray-600 my-4" />

          {/* 스케일 조절 */}
          <div className="mb-4">
            <label className="text-gray-400 text-sm">화면 축소(스케일)</label>
            <input
              type="range"
              min="70"
              max="110"
              step="5"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full mt-2"
            />
            <div className="text-xs text-gray-400">현재: {scale}%</div>
          </div>

          <hr className="border-gray-600 my-4" />

          {/* 필터들 */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">기간</label>
              <div className="flex gap-2 mt-2">
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                  className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                />
                <input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, toDate: e.target.value }))}
                  className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-gray-400 text-sm">지역</label>
              <select
                value={filters.region}
                onChange={(e) => setFilters(prev => ({ ...prev, region: e.target.value }))}
                className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="">전체</option>
                {filterOptions.regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">채널</label>
              <select
                value={filters.channel}
                onChange={(e) => setFilters(prev => ({ ...prev, channel: e.target.value }))}
                className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="">전체</option>
                {filterOptions.channels.map(channel => (
                  <option key={channel} value={channel}>{channel}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">카테고리</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="">전체</option>
                {filterOptions.categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-gray-400 text-sm">SKU(상품코드)</label>
              <select
                value={filters.sku}
                onChange={(e) => setFilters(prev => ({ ...prev, sku: e.target.value }))}
                className="w-full mt-2 p-2 bg-gray-700 border border-gray-600 rounded text-sm"
              >
                <option value="">전체</option>
                {filterOptions.skus.map(sku => (
                  <option key={sku} value={sku}>{sku}</option>
                ))}
              </select>
            </div>
          </div>
        </aside>

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-4 overflow-y-auto">
          <div style={{ transform: `scale(${scale / 100})`, transformOrigin: 'top center' }}>
            {/* KPI 카드들 */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">행 수</div>
                <div className="text-2xl font-bold">{kpis.rows.toLocaleString()}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">총 매출</div>
                <div className="text-2xl font-bold">{Math.round(kpis.revenue).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">총 광고비</div>
                <div className="text-2xl font-bold">{Math.round(kpis.spend).toLocaleString()}</div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">ROAS</div>
                <div className="text-2xl font-bold">
                  {kpis.roas === 0 ? '-' : kpis.roas.toFixed(2)}
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-gray-400 text-sm">데이터 품질</div>
                <div className="text-sm">
                  <div className={`inline-block px-2 py-1 rounded text-xs mb-1 ${
                    qualityBadges.matchRate >= 95 ? 'bg-green-600' : 
                    qualityBadges.matchRate >= 85 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    매칭률: {qualityBadges.matchRate}%
                  </div>
                  <br />
                  <div className={`inline-block px-2 py-1 rounded text-xs ${
                    qualityBadges.missingRate <= 5 ? 'bg-green-600' : 
                    qualityBadges.missingRate <= 15 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}>
                    누락행: {qualityBadges.missingRate}%
                  </div>
                </div>
              </div>
            </div>

            {/* 차트들 */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">일자별 판매량 × 평균기온</h3>
                <div className="h-64">
                  {/* 차트 컴포넌트는 여기에 구현 */}
                  <div className="flex items-center justify-center h-full text-gray-400">
                    차트 구현 예정
                  </div>
                </div>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">일자별 매출 × 광고비 × ROAS</h3>
                <div className="h-64">
                  <div className="flex items-center justify-center h-full text-gray-400">
                    차트 구현 예정
                  </div>
                </div>
              </div>
            </div>

            {/* 테이블 */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">데이터 미리보기 (상위 100행)</h3>
                <button
                  onClick={exportCSV}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
                >
                  CSV 내보내기
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-600">
                      {view.length > 0 && Object.keys(view[0]).map(key => (
                        <th key={key} className="text-left p-2">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {view.slice(0, 100).map((row, index) => (
                      <tr key={index} className="border-b border-gray-700">
                        {Object.values(row).map((value, i) => (
                          <td key={i} className="p-2">{String(value || '')}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
