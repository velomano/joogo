import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const g = sp.get("g") ?? "day";

  // 기본값 가드(누락 시 오늘 기준 최근 30일)
  const today = new Date().toISOString().slice(0,10);
  const _to = to ?? today;
  const _from = from ?? new Date(Date.now()-29*86400000).toISOString().slice(0,10);

  console.log('API 호출:', { from: _from, to: _to, granularity: g });

  // Mock 데이터 생성 (실제로는 Supabase에서 가져와야 함)
  const generateMockData = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const data: { ts: string; value: number }[] = [];
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const ts = d.toISOString().slice(0, 10);
      const value = Math.floor(Math.random() * 1000) + 100; // 100-1100 사이의 랜덤 값
      data.push({ ts, value });
    }
    
    return data;
  };

  try {
    const series = generateMockData(_from, _to);
    console.log('생성된 데이터 개수:', series.length);
    return Response.json(series);
  } catch (error) {
    console.error('API 오류:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
