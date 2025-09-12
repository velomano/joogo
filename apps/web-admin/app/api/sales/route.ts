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

    // Mock Cafe24 서버에서 데이터 조회 (환경 변수 기반)
    const mockServerUrl = process.env.MOCK_CAFE24_URL || process.env.MOCK_BASE_URL;
    
    // Mock 서버 URL이 설정되지 않은 경우 Supabase에서 직접 조회
    if (!mockServerUrl) {
      console.log('Mock 서버 URL이 설정되지 않음. Supabase에서 직접 조회');
      
      const { data: salesData, error } = await supaAdmin()
        .from('sales_analysis')
        .select('*')
        .gte('date', _from)
        .lte('date', _to)
        .order('date', { ascending: true });

      if (error) {
        console.error('Supabase 조회 오류:', error);
        throw new Error(`Supabase 오류: ${error.message}`);
      }

      const formattedData = salesData?.map(item => ({
        ts: item.date,
        value: item.revenue || 0
      })) || [];

      console.log(`Supabase에서 가져온 매출 데이터 개수: ${formattedData.length}`);

      const apiResponse = NextResponse.json(formattedData);
      apiResponse.headers.set('X-API-Status', 'success');
      apiResponse.headers.set('X-Data-Source', 'supabase');
      
      return apiResponse;
    }

    // Mock 서버가 설정된 경우
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
    console.log(`Mock 서버에서 가져온 매출 데이터 개수: ${data?.length || 0}`);

    // 응답 헤더에 상태 정보 추가
    const apiResponse = NextResponse.json(data);
    apiResponse.headers.set('X-API-Status', 'success');
    apiResponse.headers.set('X-Data-Source', 'mock-server');
    
    return apiResponse;
    
  } catch (error) {
    console.error('Sales API 오류:', error);
    
    // 더 현실적인 fallback 데이터 생성
    const generateFallbackData = (from: string, to: string) => {
      const startDate = new Date(from);
      const endDate = new Date(to);
      const data = [];
      
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().slice(0, 10);
        // 랜덤한 매출 데이터 생성 (1000-5000 범위)
        const value = Math.floor(Math.random() * 4000) + 1000;
        data.push({ ts: dateStr, value });
      }
      
      return data;
    };
    
    const fallbackData = generateFallbackData(_from, _to);
    console.log(`Fallback 데이터 생성: ${fallbackData.length}개`);
    
    const response = NextResponse.json(fallbackData);
    response.headers.set('X-API-Status', 'fallback');
    response.headers.set('X-Data-Source', 'fallback');
    
    return response;
  }
}
