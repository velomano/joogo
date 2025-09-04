"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import ErrorBanner from "@/components/ErrorBanner";
import { ensureChart, lineConfig, barConfig, scatterConfig, doughnutConfig, scatterWithTrendConfig } from "@/lib/charts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const arr = (v: any) => (Array.isArray(v) ? v : []);

// 하드코딩된 테넌트 옵션들
const TENANT_OPTIONS = [
  { id: "84949b3c-2cb7-4c42-b9f9-d1f37d371e00", name: "메인 테넌트 (샘플 데이터)" },
  { id: "dev-tenant", name: "개발 테넌트" },
  { id: "test-tenant", name: "테스트 테넌트" },
];

// 도시별 기상청 좌표
const CITY = {
  SEOUL: { name: "서울", nx: "60", ny: "127" },
  BUSAN: { name: "부산", nx: "98", ny: "76" },
  INCHEON: { name: "인천", nx: "55", ny: "124" },
  DAEGU: { name: "대구", nx: "89", ny: "90" },
  DAEJEON: { name: "대전", nx: "67", ny: "100" },
  GWANGJU: { name: "광주", nx: "58", ny: "74" }
} as const;

export default function BoardPage() {
  const [tenantId, setTenantId] = useState<string>("84949b3c-2cb7-4c42-b9f9-d1f37d371e00");
  const [from, setFrom] = useState<string>("2025-01-01");
  const [to, setTo] = useState<string>("2025-12-31");
  const [errMsg, setErrMsg] = useState("");
  const [ingestMsg, setIngestMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [applyTick, setApplyTick] = useState(1);
  const [customTenantId, setCustomTenantId] = useState<string>("");
  const [cityKey, setCityKey] = useState<keyof typeof CITY>("SEOUL");
  const [region, setRegion] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sku, setSku] = useState<string>("");

  const dTenant = useDebouncedValue(tenantId, 200);
  const dFrom = useDebouncedValue(from, 200);
  const dTo = useDebouncedValue(to, 200);

  const swrKey = dTenant && applyTick > 0 ? ["board-charts", dTenant, dFrom, dTo, region, channel, category, sku] as const : null;
  const insightsKey = dTenant && applyTick > 0 ? ["board-insights", dTenant, dFrom, dTo, region, channel, category, sku] as const : null;
  
  const { data: insights } = useSWR(insightsKey, async ([, t, f, to_, rg, ch, ca, s]) => {
    const qs = new URLSearchParams({ tenant_id: t, from: f, to: to_, lead_time: "7", z: "1.65" });
    if (rg) qs.set("region", rg);
    if (ch) qs.set("channel", ch);
    if (ca) qs.set("category", ca);
    if (s)  qs.set("sku", s);
    const url = `/api/board/insights?${qs.toString()}`;
    const r = await fetch(url);
    return await r.json();
  }, { revalidateOnFocus: false, dedupingInterval: 15000 });

  const wxKey = ["weather", CITY[cityKey].nx, CITY[cityKey].ny] as const;
  const { data: wx } = useSWR(wxKey, async ([, nx, ny]) => {
    const res = await fetch(`/api/weather/current?nx=${nx}&ny=${ny}`);
    return await res.json();
  }, { dedupingInterval: 5 * 60 * 1000, revalidateOnFocus: false });

  const { data, error, isLoading, mutate } = useSWR(
    swrKey,
    async ([, t, f, to_, rg, ch, ca, s]) => {
      try {
        const qs = new URLSearchParams({ from: f, to: to_, tenant_id: t });
        if (rg) qs.set("region", rg);
        if (ch) qs.set("channel", ch);
        if (ca) qs.set("category", ca);
        if (s)  qs.set("sku", s);
        const url = `/api/board/charts?${qs.toString()}`;
        const res = await fetch(url, { headers: { "x-tenant-id": t } });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        return {
          ok: !!json?.ok,
          salesDaily: arr(json?.salesDaily),
          roasByChannel: arr(json?.roasByChannel),
          topCategories: arr(json?.topCategories),
          topRegions: arr(json?.topRegions),
          topSkus: arr(json?.topSkus),
          cumulativeRevenue: arr(json?.cumulativeRevenue),
          tempVsSales: arr(json?.tempVsSales),
          spendRevDaily: arr(json?.spendRevDaily),
        };
      } catch (err) {
        console.error("❌ API 요청 실패:", err);
        throw err;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      dedupingInterval: 15000,
      keepPreviousData: true,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  useEffect(() => {
    if (error) {
      console.error("❌ SWR 에러:", error);
      setErrMsg(`데이터 로드 실패: ${error.message || "알 수 없는 오류"}`);
    }
  }, [error]);

  const applyClientFilters = (data: any) => {
    if (!data) return data;
    
    const filterData = (items: any[], key: string, filterValue: string) => {
      if (!filterValue) return items;
      return items.filter((item: any) => item[key] === filterValue);
    };

    return {
      ...data,
      salesDaily: filterData(data.salesDaily, 'region', region) || data.salesDaily,
      roasByChannel: filterData(data.roasByChannel, 'channel', channel) || data.roasByChannel,
      topCategories: filterData(data.topCategories, 'category', category) || data.topCategories,
      topRegions: filterData(data.topRegions, 'region', region) || data.topRegions,
      topSkus: filterData(data.topSkus, 'sku', sku) || data.topSkus,
      cumulativeRevenue: filterData(data.cumulativeRevenue, 'region', region) || data.cumulativeRevenue,
      tempVsSales: filterData(data.tempVsSales, 'region', region) || data.tempVsSales,
      spendRevDaily: filterData(data.spendRevDaily, 'region', region) || data.spendRevDaily,
    };
  };

  useEffect(() => {
    if (!data) return;
    
    const filteredData = applyClientFilters(data);
    
    // 기본 차트들
    const labels = arr(filteredData.salesDaily).map((r: any) => r.sale_date);
    const values = arr(filteredData.salesDaily).map((r: any) => Number(r.revenue || 0));
    ensureChart("chart-sales-by-date", lineConfig(labels, "일자별 매출", values));

    const chLabels = arr(filteredData.roasByChannel).map((r: any) => r.channel);
    const chValues = arr(filteredData.roasByChannel).map((r: any) => Number(r.avg_roas || 0));
    ensureChart("chart-roas-by-channel", barConfig(chLabels, "채널별 ROAS(평균)", chValues));

    const cumL = arr(filteredData.cumulativeRevenue).map((r: any) => r.sale_date);
    const cumV = arr(filteredData.cumulativeRevenue).map((r: any) => Number(r.cum_revenue || 0));
    ensureChart("chart-cum-revenue", lineConfig(cumL, "누적 매출", cumV));

    ensureChart(
      "chart-top-categories",
      barConfig(
        arr(filteredData.topCategories).map((r: any) => r.category),
        "TOP 카테고리(매출)",
        arr(filteredData.topCategories).map((r: any) => Number(r.revenue || 0))
      )
    );

    ensureChart(
      "chart-top-regions",
      barConfig(
        arr(filteredData.topRegions).map((r: any) => r.region),
        "TOP 지역(매출)",
        arr(filteredData.topRegions).map((r: any) => Number(r.revenue || 0))
      )
    );

    ensureChart(
      "chart-top-skus",
      barConfig(
        arr(filteredData.topSkus).map((r: any) => r.sku),
        "TOP SKU(매출)",
        arr(filteredData.topSkus).map((r: any) => Number(r.revenue || 0))
      )
    );
  }, [data, region, channel, category, sku]);

  const tipCards = useMemo(() => {
    const tips: any[] = [];
    const tr = insights?.tempReg, sr = insights?.spendReg;
    
    if (tr?.slope != null && tr?.r2 != null) {
      const s = Number(tr.slope).toFixed(2);
      tips.push({
        title: "🌡️ 온도 ↔ 판매 민감도",
        body: `1℃ 상승 시 일판매량이 평균 ${s} 만큼 변화합니다 (R²≈${Number(tr.r2).toFixed(2)}).`
      });
    }
    
    if (sr?.slope != null) {
      const m = Number(sr.slope).toFixed(2);
      tips.push({
        title: "💰 광고 한계 수익",
        body: `광고비 1원 증액 시 매출이 평균 ${m}원 증가 (추세선 기울기).`
      });
    }
    
    const aCnt = (insights?.abc??[]).filter((x:any)=>x.grade==='A').length;
    if (aCnt) tips.push({ 
      title: "📊 ABC 분석", 
      body: `A그룹 SKU ${aCnt}개가 매출의 80%를 차지합니다. A그룹 집중 운영을 권장합니다.` 
    });
    
    return tips;
  }, [insights]);

  // 인사이트 차트 렌더링
  useEffect(() => {
    if (!data) return;
    const as = (v:any)=> Array.isArray(v)? v : [];
    const filteredData = applyClientFilters(data);

    // 온도와 판매량/매출 시계열 선그래프
    const tempVsSales = as(filteredData.tempVsSales);
    const labels = tempVsSales.map((r: any) => r.sale_date);
    const tempValues = tempVsSales.map((r: any) => Number(r.tavg || 0));
    const qtyValues = tempVsSales.map((r: any) => Number(r.qty || 0));
    const revValues = tempVsSales.map((r: any) => Number(r.revenue || 0));
    
    ensureChart("chart-temp-vs-sales", {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '평균기온(°C)',
            data: tempValues,
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            yAxisID: 'y1',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: '판매량',
            data: qtyValues,
            borderColor: '#4ecdc4',
            backgroundColor: 'rgba(78, 205, 196, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: '매출',
            data: revValues,
            borderColor: '#45b7d1',
            backgroundColor: 'rgba(69, 183, 209, 0.1)',
            yAxisID: 'y',
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
            title: { display: true, text: '판매량 / 매출' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: '평균기온(°C)' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          title: { display: true, text: '온도와 판매량/매출의 시계열 관계' }
        }
      }
    });

    // 광고비 vs 매출 시계열 선그래프
    const spendRevData = as(filteredData.spendRevDaily);
    const spendLabels = spendRevData.map((r: any) => r.sale_date);
    const spendValues = spendRevData.map((r: any) => Number(r.spend || 0));
    const revenueValues = spendRevData.map((r: any) => Number(r.revenue || 0));
    const roasValues = spendRevData.map((r: any) => {
      const spend = Number(r.spend || 0);
      const revenue = Number(r.revenue || 0);
      return spend > 0 ? revenue / spend : 0;
    });
    
    ensureChart("chart-spend-vs-rev", {
      type: 'line',
      data: {
        labels: spendLabels,
        datasets: [
          {
            label: '광고비',
            data: spendValues,
            borderColor: '#ff9f43',
            backgroundColor: 'rgba(255, 159, 67, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: '매출',
            data: revenueValues,
            borderColor: '#10ac84',
            backgroundColor: 'rgba(16, 172, 132, 0.1)',
            yAxisID: 'y',
            tension: 0.4,
            pointRadius: 3
          },
          {
            label: 'ROAS',
            data: roasValues,
            borderColor: '#5f27cd',
            backgroundColor: 'rgba(95, 39, 205, 0.1)',
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
            title: { display: true, text: '광고비 / 매출' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'ROAS' },
            grid: { drawOnChartArea: false }
          }
        },
        plugins: {
          title: { display: true, text: '광고비와 매출의 시계열 관계 (ROAS 포함)' }
        }
      }
    });

    // ABC 분석 도넛 차트
    if (insights?.abc && Array.isArray(insights.abc) && insights.abc.length > 0) {
      const abc = insights.abc;
      const pie = ["A", "B", "C"].map(g => {
        const filtered = abc.filter((x: any) => x.grade === g);
        const sum = filtered.reduce((s: number, x: any) => s + Number(x.revenue || 0), 0);
        return sum;
      });
      
      ensureChart("chart-abc", {
        type: 'doughnut',
        data: {
          labels: ["A그룹 (80%)", "B그룹 (15%)", "C그룹 (5%)"],
          datasets: [{
            data: pie,
            backgroundColor: ['#ff6b6b', '#ffa726', '#66bb6a'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: `ABC 분석 (총 ${abc.length}개 SKU)` },
            legend: { position: 'bottom' }
          }
        }
      });
    } else {
      ensureChart("chart-abc", {
        type: 'doughnut',
        data: {
          labels: ["A그룹", "B그룹", "C그룹"],
          datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#ff6b6b', '#ffa726', '#66bb6a'],
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: { display: true, text: 'ABC 분석 (데이터 없음)' }
          }
        }
      });
    }
  }, [data, insights, region, channel, category, sku]);

  async function handleUpload() {
    try {
      setErrMsg("");
      setIngestMsg("");
      if (!tenantId) throw new Error("tenant_id를 입력하세요");
      if (!file) throw new Error("CSV 파일을 선택하세요");
      const fd = new FormData();
      fd.append("tenant_id", tenantId);
      fd.append("file", file);
      const res = await fetch("/api/board/ingest", { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "ingest failed");
      setIngestMsg(`업로드 완료: ${json.inserted}행 (file_id=${json.file_id})`);
      await mutate();
    } catch (e: any) {
      setErrMsg(e?.message ?? "업로드 오류");
    }
  }

  function applyFilters() {
    setErrMsg("");
    setIngestMsg("");
    setApplyTick((n) => n + 1);
  }

  function handleTenantSelect(selectedId: string) {
    if (selectedId === "custom") {
      setTenantId(customTenantId);
    } else {
      setTenantId(selectedId);
      setCustomTenantId("");
    }
  }

  function handleCustomTenantApply() {
    if (customTenantId.trim()) {
      setTenantId(customTenantId.trim());
    }
  }

  async function handleDataReset() {
    try {
      setErrMsg("");
      setIngestMsg("");
      
      if (!tenantId) {
        throw new Error("테넌트 ID를 먼저 선택하세요");
      }

      const confirmed = window.confirm(
        `정말로 "${tenantId}" 테넌트의 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      );
      
      if (!confirmed) return;

      const res = await fetch("/api/board/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "리셋 실패");

      setIngestMsg(`데이터 리셋 완료: ${json.deleted_rows}행 삭제됨`);
      await mutate();
      
    } catch (e: any) {
      setErrMsg(e?.message ?? "데이터 리셋 오류");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="flex">
        {/* 좌측 사이드바 */}
        <div className="w-80 bg-white border-r border-gray-200 p-4 h-screen overflow-y-auto">
          <ErrorBanner message={errMsg} onClose={() => setErrMsg("")} />
          
          {/* 날씨 정보 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 text-gray-700">날씨 정보</h3>
            <div className="space-y-2">
              <select
                value={cityKey} 
                onChange={e => setCityKey(e.target.value as any)}
                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
              >
                {Object.entries(CITY).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
              <div className="rounded-lg border px-3 py-2 bg-gray-50">
                <div className="text-xs text-gray-500 mb-1">현재 날씨 · {CITY[cityKey].name}</div>
                <div className="flex items-baseline gap-3">
                  <div className="text-xl font-semibold">{wx?.T1H ?? "–"}°</div>
                  <div className="text-xs text-gray-600">습도 {wx?.REH ?? "–"}%</div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  강수 {wx?.RN1 ?? "–"}mm · 풍속 {wx?.WSD ?? "–"}m/s
                </div>
              </div>
            </div>
          </div>

          {/* 데이터 관리 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 text-gray-700">데이터 관리</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">CSV 업로드</label>
                <div className="space-y-2 mt-1">
                  <input 
                    type="file" 
                    accept=".csv,text/csv" 
                    onChange={e => setFile(e.target.files?.[0] ?? null)} 
                    className="w-full border border-gray-300 rounded px-2 py-1 text-sm" 
                  />
                  <div className="flex gap-2">
                    <button 
                      onClick={handleUpload} 
                      className="flex-1 px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm" 
                      disabled={isLoading}
                    >
                      📤 업로드
                    </button>
                    <button 
                      onClick={handleDataReset} 
                      className="flex-1 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium" 
                      disabled={isLoading || !tenantId}
                    >
                      🗑️ 리셋
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 필터 섹션 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 text-gray-700">필터</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">시작 날짜</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1" 
                  value={from} 
                  onChange={e => setFrom(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">종료 날짜</label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1" 
                  value={to} 
                  onChange={e => setTo(e.target.value)} 
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">지역</label>
                <select 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1" 
                  value={region} 
                  onChange={e => setRegion(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="SEOUL">서울</option>
                  <option value="BUSAN">부산</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">채널</label>
                <select 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1" 
                  value={channel} 
                  onChange={e => setChannel(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="web">웹</option>
                  <option value="app">앱</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">카테고리</label>
                <select 
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm mt-1" 
                  value={category} 
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="">전체</option>
                  <option value="Outer">아우터</option>
                  <option value="Inner">이너</option>
                  <option value="Shoes">신발</option>
                </select>
              </div>
              <button 
                onClick={applyFilters} 
                className="w-full px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm"
              >
                📊 조회
              </button>
            </div>
          </div>

          {/* 테넌트 선택 */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 text-gray-700">테넌트 선택</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-600 font-medium">프리셋 테넌트</label>
                <select
                  value={TENANT_OPTIONS.find(t => t.id === tenantId)?.id || "custom"} 
                  onChange={e => handleTenantSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900 focus:border-blue-500 focus:outline-none mt-1"
                >
                  {TENANT_OPTIONS.map(tenant => (
                    <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                  ))}
                  <option value="custom">직접 입력...</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">직접 입력</label>
                <div className="flex gap-1 mt-1">
                  <input
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none" 
                    placeholder="UUID 또는 테넌트 ID" 
                    value={customTenantId} 
                    onChange={e => setCustomTenantId(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleCustomTenantApply()}
                  />
                  <button
                    onClick={handleCustomTenantApply}
                    className="px-3 py-1 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm transition-colors"
                    disabled={!customTenantId.trim()}
                  >
                    적용
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600 font-medium">현재 선택</label>
                <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm font-mono text-blue-800 mt-1">
                  {tenantId || "선택되지 않음"}
                </div>
              </div>
            </div>
          </div>

          {/* 상태 메시지 */}
          <div className="space-y-2">
            {ingestMsg && <div className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded">✅ {ingestMsg}</div>}
            {isLoading && dTenant && <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">⏳ 로드중…</div>}
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 p-4 overflow-y-auto">

        {/* 네비게이션 카드 */}
        <div className="grid md:grid-cols-3 gap-3 mb-4">
          <a 
            href="/board/sales" 
            className="rounded-2xl border bg-white shadow-sm p-4 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <span className="text-xl">📊</span>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">판매 분석</div>
                <div className="text-xs text-gray-600">매출, 판매량, 채널별 성과</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">일자별 매출 추이, ROAS, 카테고리별 분석 등</div>
          </a>

          <a 
            href="/board/abc" 
            className="rounded-2xl border bg-white shadow-sm p-4 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <span className="text-xl">🔍</span>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">ABC 분석</div>
                <div className="text-xs text-gray-600">SKU별 매출 비중 분석</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">파레토 차트, A/B/C 그룹 분류, 상세 SKU 목록</div>
          </a>

          <a 
            href="/board/inventory" 
            className="rounded-2xl border bg-white shadow-sm p-4 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <span className="text-xl">📦</span>
              </div>
              <div className="ml-3">
                <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">재고 분석</div>
                <div className="text-xs text-gray-600">재고 수준, 리오더 포인트</div>
              </div>
            </div>
            <div className="text-sm text-gray-500">재고 상태, 단종 후보, 리오더 제안</div>
          </a>
        </div>

        {/* Insight 카드 */}
        <div className="grid md:grid-cols-3 gap-3 mb-3">
          {tipCards.map((t,i)=>(
            <div key={i} className="rounded-2xl border bg-white shadow-sm p-4">
              <div className="text-xs text-gray-500 mb-1">Insight</div>
              <div className="font-semibold mb-1">{t.title}</div>
              <div className="text-sm text-gray-700">{t.body}</div>
              </div>
          ))}
                  </div>

        {/* 기존 차트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">일자별 매출</h3>
            <canvas id="chart-sales-by-date" />
          </div>
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">채널별 ROAS</h3>
            <canvas id="chart-roas-by-channel" />
          </div>
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">누적 매출</h3>
            <canvas id="chart-cum-revenue" />
          </div>
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP 카테고리</h3>
            <canvas id="chart-top-categories" />
          </div>
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP 지역</h3>
            <canvas id="chart-top-regions" />
          </div>
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP SKU</h3>
            <canvas id="chart-top-skus" />
          </div>
        </div>

        {/* ABC 분석 도넛 차트 */}
        <div className="mb-4">
          <div className="h-72 rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">ABC 분석 (매출 비중)</h3>
            <canvas id="chart-abc" />
          </div>
        </div>

        {/* 산점도 2개 - 하단으로 이동 */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="h-72 rounded-2xl border bg-white shadow-sm p-4">
            <h3 className="text-sm mb-2">평균기온(°C) vs 판매량/매출</h3>
            <canvas id="chart-temp-vs-sales" />
          </div>
          <div className="h-72 rounded-2xl border bg-white shadow-sm p-4">
            <h3 className="text-sm mb-2">광고비 vs 매출 (추세선)</h3>
            <canvas id="chart-spend-vs-rev" />
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
