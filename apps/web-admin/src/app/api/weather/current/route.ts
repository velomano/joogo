export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

function kmaBase(now = new Date()) {
  // 초단기 실황은 보통 최근 정시 기준. 40분 이전 시각으로 보정.
  const d = new Date(now.getTime() - 40 * 60 * 1000);
  const base_date = d.toISOString().slice(0, 10).replace(/-/g, "");
  const base_time = d.getHours().toString().padStart(2, "0") + "00";
  return { base_date, base_time };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const nx = searchParams.get("nx") || "60";   // 서울 기본
    const ny = searchParams.get("ny") || "127";
    const key = process.env.KMA_SERVICE_KEY;
    const baseUrl = process.env.KMA_BASE_URL || "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
    if (!key) return NextResponse.json({ ok: false, error: "KMA_SERVICE_KEY missing" }, { status: 500 });

    const { base_date, base_time } = kmaBase();
    const qs = new URLSearchParams({
      serviceKey: key, pageNo: "1", numOfRows: "1000", dataType: "JSON",
      base_date, base_time, nx, ny
    });

    // 초단기 실황
    const url = `${baseUrl}/getUltraSrtNcst?${qs.toString()}`;
    const r = await fetch(url, { cache: "no-store" });
    const j = await r.json().catch(() => ({} as any));
    const items = j?.response?.body?.items?.item ?? [];

    // 관심 값만 추출: 기온(T1H), 강수(RN1, mm), 습도(REH, %), 풍속(WSD)
    const map: Record<string, any> = {};
    for (const it of items) map[it.category] = it.obsrValue;

    const payload = {
      ok: true,
      baseDate: j?.response?.body?.baseDate || base_date,
      baseTime: j?.response?.body?.baseTime || base_time,
      nx, ny,
      T1H: map.T1H ?? null,
      RN1: map.RN1 ?? null,
      REH: map.REH ?? null,
      WSD: map.WSD ?? null,
    };

    const res = NextResponse.json(payload);
    res.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=600"); // 5분 캐시
    return res;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "weather error" }, { status: 500 });
  }
}
