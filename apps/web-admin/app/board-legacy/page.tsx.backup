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
  const [tenantId, setTenantId] = useState<string>("84949b3c-2cb7-4c42-b9f9-d1f37d371e00"); // 기본값 설정
  const [from, setFrom] = useState<string>("2025-01-01");
  const [to, setTo] = useState<string>("2025-12-31");
  const [errMsg, setErrMsg] = useState("");
  const [ingestMsg, setIngestMsg] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [applyTick, setApplyTick] = useState(1); // 초기 1회 조회 허용
  const [customTenantId, setCustomTenantId] = useState<string>(""); // 커스텀 입력용
  const [cityKey, setCityKey] = useState<keyof typeof CITY>("SEOUL"); // 날씨 도시 선택
  const [region, setRegion] = useState<string>("");
  const [channel, setChannel] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [sku, setSku] = useState<string>("");

  const dTenant = useDebouncedValue(tenantId, 200);
  const dFrom = useDebouncedValue(from, 200);
  const dTo = useDebouncedValue(to, 200);

  // 수동+초기조회 모드
  const swrKey = dTenant && applyTick > 0 ? ["board-charts", dTenant, dFrom, dTo, region, channel, category, sku] as const : null;
  
  // 인사이트 데이터
  const insightsKey = dTenant && applyTick > 0 ? ["board-insights", dTenant, dFrom, dTo, region, channel, category, sku] as const : null;
  
  // 인사이트 데이터
  const { data: insights } = useSWR(insightsKey, async ([, t, f, to_, rg, ch, ca, s]) => {
    const qs = new URLSearchParams({ tenant_id: t, from: f, to: to_, lead_time: "7", z: "1.65" });
    if (rg) qs.set("region", rg);
    if (ch) qs.set("channel", ch);
    if (ca) qs.set("category", ca);
    if (s)  qs.set("sku", s);
    const r = await fetch(`/api/board/insights?${qs.toString()}`);
    return await r.json();
  }, { revalidateOnFocus: false, dedupingInterval: 15000 });

  // 날씨 데이터
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
        console.log("🔍 API 요청 URL:", url);
        console.log("🔍 테넌트 ID:", t);
        
        const res = await fetch(url, { headers: { "x-tenant-id": t } });
        console.log("🔍 응답 상태:", res.status, res.statusText);
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const json = await res.json();
        console.log("🔍 응답 데이터:", json);
        
        // 서버가 항상 배열을 주지만 혹시 몰라 한 번 더 보정
        return {
          ok: !!json?.ok,
          salesDaily: arr(json?.salesDaily),
          roasByChannel: arr(json?.roasByChannel),
          topCategories: arr(json?.topCategories),
          topRegions: arr(json?.topRegions),
          topSkus: arr(json?.topSkus),
          cumulativeRevenue: arr(json?.cumulativeRevenue),
          tempVsSales: arr(json?.tempVsSales),
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

  useEffect(() => {
    if (!data) return;
    // 1) 일자별 매출
    const labels = arr(data.salesDaily).map((r: any) => r.sale_date);
    const values = arr(data.salesDaily).map((r: any) => Number(r.revenue || 0));
    ensureChart("chart-sales-by-date", lineConfig(labels, "일자별 매출", values));

    // 2) 채널별 ROAS
    const chLabels = arr(data.roasByChannel).map((r: any) => r.channel);
    const chValues = arr(data.roasByChannel).map((r: any) => Number(r.avg_roas || 0));
    ensureChart("chart-roas-by-channel", barConfig(chLabels, "채널별 ROAS(평균)", chValues));

    // 3) 누적 매출
    const cumL = arr(data.cumulativeRevenue).map((r: any) => r.sale_date);
    const cumV = arr(data.cumulativeRevenue).map((r: any) => Number(r.cum_revenue || 0));
    ensureChart("chart-cum-revenue", lineConfig(cumL, "누적 매출", cumV));

    // 4) TOP 카테고리
    ensureChart(
      "chart-top-categories",
      barConfig(
        arr(data.topCategories).map((r: any) => r.category),
        "TOP 카테고리(매출)",
        arr(data.topCategories).map((r: any) => Number(r.revenue || 0))
      )
    );

    // 5) TOP 지역
    ensureChart(
      "chart-top-regions",
      barConfig(
        arr(data.topRegions).map((r: any) => r.region),
        "TOP 지역(매출)",
        arr(data.topRegions).map((r: any) => Number(r.revenue || 0))
      )
    );

    // 6) TOP SKU
    ensureChart(
      "chart-top-skus",
      barConfig(
        arr(data.topSkus).map((r: any) => r.sku),
        "TOP SKU(매출)",
        arr(data.topSkus).map((r: any) => Number(r.revenue || 0))
      )
    );

    // 7) 온도 vs 매출 산점도는 인사이트 섹션으로 이동
  }, [data]);

  // 인사이트 카드 생성
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
    
    const eolN = insights?.eol?.length || 0;
    if (eolN) tips.push({ 
      title: "⚠️ 단종 후보", 
      body: `최근 30일 무판매/하락 추세 SKU ${eolN}개 발견. 재고·광고 정리 검토.` 
    });
    
    return tips;
  }, [insights]);

  // 인사이트 차트 렌더링
  useEffect(() => {
    if (!data) return;
    const as = (v:any)=> Array.isArray(v)? v : [];

    // A) Temp(°C) vs Sales (revenue fallback to qty)
    const ptsA = as(data.tempVsSales).map((r:any)=>({ x:Number(r.tavg||0), y:Number(r.revenue ?? r.qty ?? 0) }));
    ensureChart("chart-temp-vs-sales", scatterConfig(ptsA, "일자 포인트", "평균기온(°C)", "매출/판매량"));

    // B) Spend vs Revenue with trendline
    const ptsB = as(data.spendRevDaily).map((r:any)=>({ x:Number(r.spend||0), y:Number(r.revenue||0) }))
      .filter(p=>Number.isFinite(p.x) && Number.isFinite(p.y));
    const slope  = Number(insights?.spendReg?.slope ?? 0);
    const interc = Number(insights?.spendReg?.intercept ?? 0);
    const trend  = ptsB.slice().sort((a,b)=>a.x-b.x).map(p=>({ x:p.x, y: interc + slope*p.x }));
    ensureChart("chart-spend-vs-rev", scatterWithTrendConfig(ptsB, trend, "일자 포인트", "추세선", "광고비", "매출"));

    // C) ABC 도넛 차트
    if (insights?.abc) {
      const abc = insights.abc ?? [];
      const pie = ["A", "B", "C"].map(g => 
        abc.filter((x: any) => x.grade === g).reduce((s: number, x: any) => s + Number(x.revenue || 0), 0)
      );
      ensureChart("chart-abc", doughnutConfig(["A", "B", "C"], pie));
    }
  }, [data, insights]);

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
      await mutate(); // 업로드 후 1회 재조회
    } catch (e: any) {
      setErrMsg(e?.message ?? "업로드 오류");
    }
  }

  function applyFilters() {
    setErrMsg("");
    setIngestMsg("");
    // 수동 조회
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    setApplyTick((n) => n + 1);
  }

  // 테넌트 선택 핸들러
  function handleTenantSelect(selectedId: string) {
    if (selectedId === "custom") {
      setTenantId(customTenantId);
    } else {
      setTenantId(selectedId);
      setCustomTenantId(""); // 커스텀 입력 초기화
    }
  }

  // 커스텀 테넌트 ID 적용
  function handleCustomTenantApply() {
    if (customTenantId.trim()) {
      setTenantId(customTenantId.trim());
    }
  }

  // 데이터 리셋 함수
  async function handleDataReset() {
    try {
      setErrMsg("");
      setIngestMsg("");
      
      if (!tenantId) {
        throw new Error("테넌트 ID를 먼저 선택하세요");
      }

      // 확인 대화상자
      const confirmed = window.confirm(
        `정말로 "${tenantId}" 테넌트의 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`
      );
      
      if (!confirmed) return;

      // 데이터 삭제 API 호출
      const res = await fetch("/api/board/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId })
      });
      
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "리셋 실패");

      setIngestMsg(`데이터 리셋 완료: ${json.deleted_rows}행 삭제됨`);
      
      // 차트 새로고침
      await mutate();
      
    } catch (e: any) {
      setErrMsg(e?.message ?? "데이터 리셋 오류");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] text-[#e7edf5]">
      <div className="max-w-[1500px] mx-auto p-4">
        <ErrorBanner message={errMsg} onClose={() => setErrMsg("")} />

        {/* 테넌트 선택 섹션 */}
        <div className="bg-[#0f151d] border border-[#1b2533] rounded-2xl p-4 mb-4">
          <h3 className="text-sm font-medium mb-3 text-[#e7edf5]">테넌트 선택</h3>
          <div className="flex flex-wrap gap-3 items-end">
            {/* 프리셋 테넌트 선택 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#9aa0a6]">프리셋 테넌트</label>
              <select
                value={TENANT_OPTIONS.find(t => t.id === tenantId)?.id || "custom"} 
                onChange={e => handleTenantSelect(e.target.value)}
                className="border rounded px-2 py-1 text-sm min-w-[200px]"
              >
                {TENANT_OPTIONS.map(tenant => (
                  <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
                ))}
                <option value="custom">직접 입력...</option>
              </select>
            </div>

            {/* 커스텀 테넌트 ID 입력 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">직접 입력</label>
              <div className="flex gap-1">
                <input
                  className="border rounded px-2 py-1 text-sm w-64" 
                  placeholder="UUID 또는 테넌트 ID 입력" 
                  value={customTenantId} 
                  onChange={e => setCustomTenantId(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && handleCustomTenantApply()}
                />
                <button
                  onClick={handleCustomTenantApply}
                  className="px-3 py-1 rounded-md border hover:bg-gray-50 text-sm"
                  disabled={!customTenantId.trim()}
                >
                  적용
                </button>
              </div>
            </div>

            {/* 현재 선택된 테넌트 표시 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">현재 선택</label>
              <div className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-sm font-mono text-blue-800">
                {tenantId || "선택되지 않음"}
              </div>
            </div>
          </div>
        </div>

        {/* 필터 및 업로드 섹션 */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm">
          <h3 className="text-sm font-medium mb-3 text-gray-700">필터 및 데이터 관리</h3>
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">시작 날짜</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={from} onChange={e => setFrom(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">종료 날짜</label>
              <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={to} onChange={e => setTo(e.target.value)} />
            </div>

            {/* 필터 추가 */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">지역</label>
              <select className="border rounded-lg px-3 py-2 text-sm" value={region} onChange={e => setRegion(e.target.value)}>
                <option value="">전체</option>
                <option value="SEOUL">서울</option>
                <option value="BUSAN">부산</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">채널</label>
              <select className="border rounded-lg px-3 py-2 text-sm" value={channel} onChange={e => setChannel(e.target.value)}>
                <option value="">전체</option>
                <option value="web">웹</option>
                <option value="app">앱</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">카테고리</label>
              <select className="border rounded-lg px-3 py-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
                <option value="">전체</option>
                <option value="Outer">아우터</option>
                <option value="Inner">이너</option>
                <option value="Shoes">신발</option>
              </select>
            </div>
            <button onClick={applyFilters} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium text-sm">
              📊 조회
            </button>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-600">CSV 업로드</label>
              <div className="flex gap-2">
                <input type="file" accept=".csv,text/csv" onChange={e => setFile(e.target.files?.[0] ?? null)} className="border rounded-lg px-3 py-2 text-sm" />
                <button onClick={handleUpload} className="px-3 py-2 rounded-lg border hover:bg-gray-50 text-sm" disabled={isLoading}>
                  📤 업로드
                </button>
                <button 
                  onClick={handleDataReset} 
                  className="px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium" 
                  disabled={isLoading || !tenantId}
                  title="선택된 테넌트의 모든 데이터를 삭제합니다"
                >
                  🗑️ 리셋
                </button>
              </div>
            </div>

            {/* 날씨 카드 */}
            <div className="ml-auto flex items-center gap-3">
              <select
                value={cityKey} 
                onChange={e => setCityKey(e.target.value as any)}
                className="h-9 rounded-lg border px-3 text-sm"
              >
                {Object.entries(CITY).map(([k, v]) => (
                  <option key={k} value={k}>{v.name}</option>
                ))}
              </select>
              <div className="rounded-2xl border px-4 py-3 bg-white shadow-sm">
                <div className="text-xs text-gray-500 mb-1">현재 날씨 · {CITY[cityKey].name}</div>
                <div className="flex items-baseline gap-4">
                  <div className="text-2xl font-semibold">{wx?.T1H ?? "–"}°</div>
                  <div className="text-sm text-gray-600">습도 {wx?.REH ?? "–"}%</div>
                  <div className="text-sm text-gray-600">강수 {wx?.RN1 ?? "–"}mm</div>
                  <div className="text-sm text-gray-600">풍속 {wx?.WSD ?? "–"}m/s</div>
                </div>
              </div>
            </div>
          </div>

          {/* 상태 메시지 */}
          <div className="mt-4 flex gap-4 items-center">
            {ingestMsg && <span className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg">✅ {ingestMsg}</span>}
            {isLoading && dTenant && <span className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">⏳ 로드중…</span>}
          </div>
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

        {/* 산점도 2개 */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="h-72 rounded-2xl border bg-white shadow-sm p-3">
            <h3 className="text-sm mb-2">평균기온(°C) vs 판매량/매출</h3>
            <canvas id="chart-temp-vs-sales" />
          </div>
          <div className="h-72 rounded-2xl border bg-white shadow-sm p-3">
            <h3 className="text-sm mb-2">광고비 vs 매출 (추세선)</h3>
            <canvas id="chart-spend-vs-rev" />
          </div>
        </div>

        {/* 기존 차트 섹션 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

    </div>
  );
}