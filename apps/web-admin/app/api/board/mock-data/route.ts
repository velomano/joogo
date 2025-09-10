export const runtime = "edge";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "../../../../lib/supabase/server";

// Mock 데이터 생성 함수
function generateMockData(hours: number = 24) {
  const data: any[] = [];
  const now = new Date();
  
  for (let i = 0; i < hours; i++) {
    const date = new Date(now.getTime() - i * 60 * 60 * 1000);
    const dateStr = date.toISOString().slice(0, 10);
    
    // 시간대별로 다른 패턴 생성
    const hour = date.getHours();
    const isBusinessHour = hour >= 9 && hour <= 18;
    const isPeakHour = hour >= 12 && hour <= 14;
    
    // 기본 수치
    let baseRevenue = isBusinessHour ? 50000 : 20000;
    if (isPeakHour) baseRevenue *= 1.5;
    
    let baseQty = isBusinessHour ? 15 : 8;
    if (isPeakHour) baseQty *= 1.3;
    
    // 랜덤 변동
    const revenueVariation = 0.8 + Math.random() * 0.4; // 80%~120%
    const qtyVariation = 0.7 + Math.random() * 0.6; // 70%~130%
    
    const revenue = Math.round(baseRevenue * revenueVariation);
    const qty = Math.round(baseQty * qtyVariation);
    const adCost = Math.round(revenue * (0.15 + Math.random() * 0.1)); // 15%~25%
    
    // SKU별 분배
    const skus = ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005'];
    const channels = ['google', 'facebook', 'naver', 'kakao'];
    const regions = ['서울', '경기', '부산', '대구', '인천'];
    const categories = ['전자제품', '의류', '식품', '도서', '생활용품'];
    
    for (let j = 0; j < Math.min(qty, 5); j++) {
      const sku = skus[Math.floor(Math.random() * skus.length)];
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const region = regions[Math.floor(Math.random() * regions.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const skuRevenue = Math.round(revenue / qty * (0.8 + Math.random() * 0.4));
      const skuQty = Math.max(1, Math.round(qty / 5 * (0.5 + Math.random())));
      const skuAdCost = Math.round(adCost / qty * (0.8 + Math.random() * 0.4));
      
      data.push({
        sale_date: dateStr,
        region,
        channel,
        category,
        sku,
        qty: skuQty,
        revenue: skuRevenue,
        ad_cost: skuAdCost,
        discount_rate: Math.round((Math.random() * 20) * 10) / 10, // 0~20%
        tavg: 15 + Math.random() * 20, // 15~35도
      });
    }
  }
  
  return data;
}

export async function POST(req: NextRequest) {
  try {
    const { tenant, source, hours = 24 } = await req.json();
    
    if (!tenant) {
      return NextResponse.json({ ok: false, error: "tenant required" }, { status: 400 });
    }
    
    if (source !== "mock") {
      return NextResponse.json({ ok: false, error: "only mock source supported" }, { status: 400 });
    }
    
    console.log(`[mock-data] Generating ${hours} hours of mock data for tenant: ${tenant}`);
    
    // Mock 데이터 생성
    const mockData = generateMockData(hours);
    console.log(`[mock-data] Generated ${mockData.length} records`);
    
    // Supabase에 직접 삽입
    const sb = supaAdmin();
    const fileId = `mock-${Date.now()}`;
    
    // 1) Stage에 삽입
    const stageResult = await sb.rpc("board_stage_insert_rows", {
      p_tenant_id: tenant,
      p_file_id: fileId,
      p_rows: mockData,
    });
    
    if (stageResult.error) {
      console.error("[mock-data] Stage insert error:", stageResult.error);
      throw stageResult.error;
    }
    
    // 2) Merge 실행
    const mergeResult = await sb.rpc("board_merge_file", {
      p_tenant_id: tenant,
      p_file_id: fileId,
    });
    
    if (mergeResult.error) {
      console.error("[mock-data] Merge error:", mergeResult.error);
      throw mergeResult.error;
    }
    
    console.log(`[mock-data] Successfully inserted ${mockData.length} records`);
    
    return NextResponse.json({
      ok: true,
      tenant,
      source,
      hours,
      inserted: mockData.length,
      file_id: fileId,
    });
    
  } catch (error: any) {
    console.error("[mock-data] Error:", error);
    return NextResponse.json({
      ok: false,
      error: error.message || "Mock data generation failed",
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Mock data generator API",
    usage: "POST with { tenant, source: 'mock', hours: 24 }",
  });
}
