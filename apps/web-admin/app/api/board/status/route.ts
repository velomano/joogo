import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from "../../../lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get('tenant_id') || '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    const sb = supaAdmin();
    
    // 기본 통계 조회
    const [salesStats, skuStats, uploadStats] = await Promise.all([
      // 판매 통계 - 퍼블릭 래퍼 함수 사용
      sb.rpc("board_sales_daily", { 
        p_tenant_id: tenantId,
        p_from: "2025-01-01", 
        p_to: "2025-12-31" 
      })
        .then(({ data, error }) => {
          if (error) throw error;
          console.log('[BOARD/STATUS] RPC data sample:', data?.slice(0, 3));
          console.log('[BOARD/STATUS] RPC data keys:', data?.[0] ? Object.keys(data[0]) : 'no data');
          const totalRevenue = data?.reduce((sum: number, row: any) => sum + Number(row.revenue || 0), 0) || 0;
          const totalQty = data?.reduce((sum: number, row: any) => sum + Number(row.qty || 0), 0) || 0;
          console.log('[BOARD/STATUS] Calculated totals:', { totalRevenue, totalQty, rowCount: data?.length });
          const avgDaily = data?.length ? totalRevenue / data.length : 0;
          return { totalRevenue, totalQty, avgDaily, days: data?.length || 0 };
        }),
      
      // SKU 통계 - RPC 함수 사용
      sb.rpc("board_top_skus", { p_tenant_id: tenantId, p_from: "2025-01-01", p_to: "2025-12-31", p_limit: 100 })
        .then(({ data, error }) => {
          if (error) throw error;
          const uniqueSkus = data?.length || 0;
          const topSku = data?.[0];
          return { uniqueSkus, topSku: topSku?.sku || 'N/A', topSkuRevenue: Number(topSku?.revenue || 0) };
        }),
      
      // 업로드 상태 - 기본값 반환
      Promise.resolve({
        latest: null,
        totalSize: 0,
        count: 0,
        status: 'COMPLETED'
      })
    ]);

    return NextResponse.json({
      ok: true,
      sales: salesStats,
      sku: skuStats,
      upload: uploadStats,
      lastUpdated: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[BOARD/STATUS] Error:', error);
    return NextResponse.json({ 
      ok: false,
      error: error.message || 'Status check failed' 
    }, { status: 500 });
  }
}
