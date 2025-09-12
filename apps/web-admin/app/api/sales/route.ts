import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../lib/supabase/server";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const from = sp.get("from");
    const to = sp.get("to");
    const g = sp.get("g") ?? "day";

    // 기본값 가드(누락 시 오늘 기준 최근 30일)
    const today = new Date().toISOString().slice(0,10);
    const _to = to ?? today;
    const _from = from ?? new Date(Date.now()-29*86400000).toISOString().slice(0,10);

    console.log('Sales API 호출 (Mock 서버에서 조회):', { from: _from, to: _to, granularity: g });

    // Mock Cafe24 서버에서 데이터 조회
    const mockServerUrl = process.env.MOCK_CAFE24_URL || 'http://localhost:8787';
    const apiUrl = `${mockServerUrl}/api/sales?from=${_from}&to=${_to}&granularity=${g}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Mock 서버 오류: ${response.status}`);
    }

    const data = await response.json();
    console.log(`가져온 매출 데이터 개수: ${data?.length || 0}`);

    // 응답 헤더에 상태 정보 추가
    const apiResponse = NextResponse.json(data);
    apiResponse.headers.set('X-API-Status', 'success');
    apiResponse.headers.set('X-Data-Source', 'mock-server');
    
    return apiResponse;
    
  } catch (error) {
    console.error('Sales API 오류:', error);
    
    // Mock 서버 오류 시 fallback 데이터
    const fallbackData = [
      { ts: '2025-01-01', value: 1000 },
      { ts: '2025-01-02', value: 1200 }
    ];
    
    const response = NextResponse.json(fallbackData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'fallback');
    
    return response;
  }
}
