"use client";

import { useEffect, useState, useMemo } from "react";
import useSWR from "swr";
import ErrorBanner from "@/components/ErrorBanner";
import { ensureChart, lineConfig, barConfig, scatterConfig, doughnutConfig, scatterWithTrendConfig } from "@/lib/charts";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
// import SourceChips from "@/components/analytics/SourceChips";
// import MockBadge from "@/components/analytics/MockBadge";
// import { SummaryCardGroup } from "@/components/analytics/cards/Cards";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [appliedFilters, setAppliedFilters] = useState({
    tenantId: "84949b3c-2cb7-4c42-b9f9-d1f37d371e00",
    from: "2025-01-01",
    to: "2025-12-31",
    region: "",
    channel: "",
    category: "",
    sku: ""
  });

  const swrKey = applyTick > 0 ? ["board-charts", appliedFilters.tenantId, appliedFilters.from, appliedFilters.to, appliedFilters.region, appliedFilters.channel, appliedFilters.category, appliedFilters.sku] as const : null;
  const insightsKey = applyTick > 0 ? ["board-insights", appliedFilters.tenantId, appliedFilters.from, appliedFilters.to, appliedFilters.region, appliedFilters.channel, appliedFilters.category, appliedFilters.sku] as const : null;
  const statusKey = ["board-status", appliedFilters.tenantId] as const;
  
  const handleApplyFilters = () => {
    setErrMsg("");
    setIngestMsg("");
    setAppliedFilters({
      tenantId,
      from,
      to,
      region,
      channel,
      category,
      sku
    });
    setApplyTick(prev => prev + 1);
  };

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

  const { data: status } = useSWR(statusKey, async ([, t]) => {
    const url = `/api/board/status?tenant_id=${t}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}: ${r.statusText}`);
    return r.json();
  }, { revalidateOnFocus: false, dedupingInterval: 10000 });

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
      salesDaily: filterData(data.salesDaily, 'region', appliedFilters.region) || data.salesDaily,
      roasByChannel: filterData(data.roasByChannel, 'channel', appliedFilters.channel) || data.roasByChannel,
      topCategories: filterData(data.topCategories, 'category', appliedFilters.category) || data.topCategories,
      topRegions: filterData(data.topRegions, 'region', appliedFilters.region) || data.topRegions,
      topSkus: filterData(data.topSkus, 'sku', appliedFilters.sku) || data.topSkus,
      cumulativeRevenue: filterData(data.cumulativeRevenue, 'region', appliedFilters.region) || data.cumulativeRevenue,
      tempVsSales: filterData(data.tempVsSales, 'region', appliedFilters.region) || data.tempVsSales,
      spendRevDaily: filterData(data.spendRevDaily, 'region', appliedFilters.region) || data.spendRevDaily,
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
      setIsUploading(true);
      setUploadProgress(0);
      
      if (!tenantId) throw new Error("tenant_id를 입력하세요");
      if (!file) throw new Error("CSV 파일을 선택하세요");
      
      // 파일 크기 확인 (1만개 행 = 약 1-2MB 예상)
      const fileSizeMB = file.size / (1024 * 1024);
      console.log(`📁 파일 크기: ${fileSizeMB.toFixed(2)}MB, 예상 행 수: ${Math.round(fileSizeMB * 5000)}개`);
      
      setUploadProgress(10);
      setIngestMsg("📤 파일 업로드 중...");
      
      const fd = new FormData();
      fd.append("tenant_id", tenantId);
      fd.append("file", file);
      
      setUploadProgress(30);
      setIngestMsg("🔄 서버에서 처리 중...");
      
      const res = await fetch("/api/upload/unified", { method: "POST", body: fd });
      setUploadProgress(60);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.json();
      setUploadProgress(80);
      
      if (!json.ok) throw new Error(json.error || "업로드 실패");
      
      setUploadProgress(100);
      setIngestMsg(`✅ 업로드 완료: ${json.inserted || json.rows_processed || '처리됨'}행 | 워커에서 백그라운드 처리 중...`);
      
      // 데이터 새로고침
      await mutate();
      
      // 3초 후 성공 메시지 업데이트
      setTimeout(() => {
        setIngestMsg("🎉 데이터 처리 완료! 차트를 확인하세요.");
        setIsUploading(false);
        setUploadProgress(0);
      }, 3000);
      
    } catch (e: any) {
      console.error("❌ 업로드 오류:", e);
      setErrMsg(e?.message ?? "업로드 오류");
      setIsUploading(false);
      setUploadProgress(0);
    }
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
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        isUploading 
                          ? 'bg-blue-50 border-blue-300 text-blue-600 cursor-not-allowed' 
                          : 'hover:bg-gray-50 border-gray-300'
                      }`}
                      disabled={isLoading || isUploading || !file}
                    >
                      {isUploading ? '⏳ 업로드 중...' : '📤 업로드'}
                    </button>
                    <button 
                      onClick={handleDataReset} 
                      className="flex-1 px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium" 
                      disabled={isLoading || isUploading || !tenantId}
                    >
                      🗑️ 리셋
                    </button>
                  </div>
                  
                  {/* 업로드 진행률 표시 */}
                  {isUploading && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>업로드 진행률</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 파일 정보 표시 */}
                  {file && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                      📁 <strong>{file.name}</strong> ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      <br />
                      예상 행 수: {Math.round(file.size / 1024 / 1024 * 5000)}개
                    </div>
                  )}
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
                onClick={handleApplyFilters} 
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
            {isLoading && appliedFilters.tenantId && <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">⏳ 로드중…</div>}
          </div>
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* 헤더 영역 */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">
              판매 분석 대시보드
            </h1>
          </div>

          {/* 기존 데이터 상태 카드 */}
            <div className="grid md:grid-cols-4 gap-3 mb-4">
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="text-xs text-gray-500 mb-1">📊 총 매출</div>
                <div className="font-semibold text-lg mb-1">
                  {status?.sales?.totalRevenue ? Number(status.sales.totalRevenue).toLocaleString() : '0'}원
                </div>
                <div className="text-sm text-gray-600">
                  {status?.sales?.days || 0}일간 평균 {status?.sales?.avgDaily ? Number(status.sales.avgDaily).toLocaleString() : '0'}원
                </div>
              </div>
              
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="text-xs text-gray-500 mb-1">📦 총 판매량</div>
                <div className="font-semibold text-lg mb-1">
                  {status?.sales?.totalQty ? Number(status.sales.totalQty).toLocaleString() : '0'}개
                </div>
                <div className="text-sm text-gray-600">
                  일평균 {status?.sales?.days ? Math.round(Number(status.sales.totalQty) / status.sales.days) : 0}개
                </div>
              </div>
              
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="text-xs text-gray-500 mb-1">🛍️ 상품 수</div>
                <div className="font-semibold text-lg mb-1">
                  {status?.sku?.uniqueSkus || 0}개 SKU
                </div>
                <div className="text-sm text-gray-600">
                  TOP: {status?.sku?.topSku || 'N/A'} ({status?.sku?.topSkuRevenue ? Number(status.sku.topSkuRevenue).toLocaleString() : '0'}원)
                </div>
              </div>
              
              <div className="rounded-2xl border bg-white shadow-sm p-4">
                <div className="text-xs text-gray-500 mb-1">📁 업로드 상태</div>
                <div className="font-semibold text-lg mb-1">
                  {status?.upload?.status === 'COMPLETED' ? '✅ 완료' : 
                   status?.upload?.status === 'PROCESSING' ? '⏳ 처리중' :
                   status?.upload?.status === 'FAILED' ? '❌ 실패' : '📤 대기'}
                </div>
                <div className="text-sm text-gray-600">
                  {status?.upload?.count || 0}개 파일 ({((status?.upload?.totalSize || 0) / 1024 / 1024).toFixed(1)}MB)
                </div>
              </div>
            </div>

            {/* Insight 카드 */}
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {tipCards.map((t,i)=>(
                <div key={i} className="rounded-2xl border bg-white shadow-sm p-4">
                  <div className="text-xs text-gray-500 mb-1">Insight</div>
                  <div className="font-semibold mb-1">{t.title}</div>
                  <div className="text-sm text-gray-700">{t.body}</div>
                  </div>
              ))}
            </div>

        {/* 산점도 2개 */}
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <h3 className="text-sm mb-2">평균기온(°C) vs 판매량/매출</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-temp-vs-sales" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.tempVsSales?.length > 0 ? (
                (() => {
                  const tempData = arr(data.tempVsSales);
                  const avgTemp = tempData.reduce((sum: number, item: any) => sum + Number(item.tavg || 0), 0) / tempData.length;
                  const avgQty = tempData.reduce((sum: number, item: any) => sum + Number(item.qty || 0), 0) / tempData.length;
                  const avgRev = tempData.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0) / tempData.length;
                  const tempReg = insights?.tempReg;
                  const correlation = tempReg?.r2 ? Number(tempReg.r2).toFixed(3) : "N/A";
                  return `🌡️ 평균기온: ${avgTemp.toFixed(1)}°C | 평균판매량: ${avgQty.toFixed(0)}개 | 평균매출: ${avgRev.toLocaleString()}원 | 온도-판매 상관관계: R²=${correlation}`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl border bg-white shadow-sm p-4">
            <h3 className="text-sm mb-2">광고비 vs 매출 (추세선)</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-spend-vs-rev" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.spendRevDaily?.length > 0 ? (
                (() => {
                  const spendData = arr(data.spendRevDaily);
                  const totalSpend = spendData.reduce((sum: number, item: any) => sum + Number(item.spend || 0), 0);
                  const totalRev = spendData.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
                  const avgRoas = totalSpend > 0 ? (totalRev / totalSpend) : 0;
                  const spendReg = insights?.spendReg;
                  const efficiency = spendReg?.slope ? Number(spendReg.slope).toFixed(2) : "N/A";
                  return `💰 총 광고비: ${totalSpend.toLocaleString()}원 | 총 매출: ${totalRev.toLocaleString()}원 | 평균 ROAS: ${avgRoas.toFixed(2)} | 광고 효율성: ${efficiency}원/원`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
        </div>

        {/* 기존 차트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">일자별 매출</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-sales-by-date" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.salesDaily?.length > 0 ? (
                (() => {
                  const sales = arr(data.salesDaily);
                  const totalRevenue = sales.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
                  const avgDaily = totalRevenue / sales.length;
                  const maxDay = sales.reduce((max: any, item: any) => 
                    Number(item.revenue || 0) > Number(max.revenue || 0) ? item : max, sales[0]);
                  const minDay = sales.reduce((min: any, item: any) => 
                    Number(item.revenue || 0) < Number(min.revenue || 0) ? item : min, sales[0]);
                  const variance = ((Number(maxDay?.revenue || 0) - Number(minDay?.revenue || 0)) / Number(minDay?.revenue || 1)) * 100;
                  return `📈 일평균 매출 ${avgDaily.toLocaleString()}원 | 최고일 대비 최저일 ${variance.toFixed(0)}% 차이 | ${maxDay?.sale_date}에 최고 매출 달성`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">채널별 ROAS</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-roas-by-channel" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.roasByChannel?.length > 0 ? (
                (() => {
                  const channels = arr(data.roasByChannel);
                  const bestChannel = channels.reduce((best: any, item: any) => 
                    Number(item.avg_roas || 0) > Number(best.avg_roas || 0) ? item : best, channels[0]);
                  const worstChannel = channels.reduce((worst: any, item: any) => 
                    Number(item.avg_roas || 0) < Number(worst.avg_roas || 0) ? item : worst, channels[0]);
                  const avgRoas = channels.reduce((sum: number, item: any) => sum + Number(item.avg_roas || 0), 0) / channels.length;
                  const bestRoas = Number(bestChannel?.avg_roas || 0);
                  const worstRoas = Number(worstChannel?.avg_roas || 0);
                  const efficiency = bestRoas > 0 ? ((bestRoas - worstRoas) / worstRoas * 100) : 0;
                  return `🎯 ${bestChannel?.channel}이 ${worstChannel?.channel} 대비 ${efficiency.toFixed(0)}% 더 효율적 | 평균 ROAS ${avgRoas.toFixed(2)} | ${bestChannel?.channel}에 집중 투자 권장`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">누적 매출</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-cum-revenue" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.cumulativeRevenue?.length > 0 ? (
                (() => {
                  const cumData = arr(data.cumulativeRevenue);
                  const totalCum = cumData[cumData.length - 1]?.cum_revenue || 0;
                  const growthRate = cumData.length > 1 ? 
                    ((Number(cumData[cumData.length - 1]?.cum_revenue || 0) - Number(cumData[0]?.cum_revenue || 0)) / Number(cumData[0]?.cum_revenue || 0) * 100) : 0;
                  const trend = growthRate > 0 ? "상승" : growthRate < 0 ? "하락" : "보합";
                  return `📊 누적 ${Number(totalCum).toLocaleString()}원 달성 | ${trend} 추세 (${growthRate.toFixed(1)}%) | ${growthRate > 0 ? "지속적 성장 중" : "성과 개선 필요"}`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP 카테고리</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-top-categories" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.topCategories?.length > 0 ? (
                (() => {
                  const categories = arr(data.topCategories);
                  const total = categories.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
                  const top1 = categories[0];
                  const top1Share = total > 0 ? (Number(top1?.revenue || 0) / total * 100) : 0;
                  const concentration = top1Share > 50 ? "높음" : top1Share > 30 ? "보통" : "낮음";
                  return `🏆 ${top1?.category}이 ${top1Share.toFixed(1)}%로 독주 | 집중도 ${concentration} | ${top1Share > 50 ? "다양화 필요" : "균형적 포트폴리오"}`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP 지역</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-top-regions" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.topRegions?.length > 0 ? (
                (() => {
                  const regions = arr(data.topRegions);
                  const total = regions.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
                  const top1 = regions[0];
                  const top1Share = total > 0 ? (Number(top1?.revenue || 0) / total * 100) : 0;
                  const gap = regions.length > 1 ? ((Number(top1?.revenue || 0) - Number(regions[1]?.revenue || 0)) / Number(regions[1]?.revenue || 1) * 100) : 0;
                  return `🌍 ${top1?.region}이 ${top1Share.toFixed(1)}%로 선도 | 2위 대비 ${gap.toFixed(0)}% 앞서감 | ${gap > 50 ? "지역별 차별화 전략 필요" : "균형적 지역 성장"}`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">TOP SKU</h3>
            <div className="h-64 mb-3">
              <canvas id="chart-top-skus" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {data?.topSkus?.length > 0 ? (
                (() => {
                  const skus = arr(data.topSkus);
                  const total = skus.reduce((sum: number, item: any) => sum + Number(item.revenue || 0), 0);
                  const top1 = skus[0];
                  const top1Share = total > 0 ? (Number(top1?.revenue || 0) / total * 100) : 0;
                  const diversity = skus.length > 5 ? "다양함" : "집중됨";
                  return `🛍️ ${top1?.sku}이 ${top1Share.toFixed(1)}%로 주력 | SKU 다양성 ${diversity} | ${top1Share > 40 ? "신제품 개발 필요" : "균형적 제품 포트폴리오"}`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
        </div>

        {/* ABC 분석 도넛 차트 */}
        <div className="mb-4">
          <div className="rounded-2xl p-4 border bg-white shadow-sm">
            <h3 className="text-sm mb-3 text-gray-700">ABC 분석 (매출 비중)</h3>
            <div className="h-48 mb-3 flex items-center justify-center">
              <canvas id="chart-abc" className="max-w-full max-h-full" />
            </div>
            <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
              {insights?.abc?.length > 0 ? (
                (() => {
                  const abc = insights.abc;
                  const aGroup = abc.filter((x: any) => x.grade === 'A');
                  const bGroup = abc.filter((x: any) => x.grade === 'B');
                  const cGroup = abc.filter((x: any) => x.grade === 'C');
                  const aRevenue = aGroup.reduce((sum: number, x: any) => sum + Number(x.revenue || 0), 0);
                  const totalRevenue = abc.reduce((sum: number, x: any) => sum + Number(x.revenue || 0), 0);
                  const aShare = totalRevenue > 0 ? (aRevenue / totalRevenue * 100) : 0;
                  return `📊 A그룹: ${aGroup.length}개 SKU (${aShare.toFixed(1)}%) | B그룹: ${bGroup.length}개 SKU | C그룹: ${cGroup.length}개 SKU | 총 ${abc.length}개 SKU | A그룹 집중도: ${aShare.toFixed(1)}%`;
                })()
              ) : "데이터 없음"}
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
  );
}
