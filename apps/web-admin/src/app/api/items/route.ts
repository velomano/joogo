import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// 환경 변수 로드 헬퍼 함수
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(`환경 변수가 누락되었습니다. SUPABASE_URL: ${!!supabaseUrl}, SUPABASE_SERVICE_ROLE_KEY: ${!!supabaseKey}`);
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // 새로운 analytics 스키마에서 데이터 조회
    const { data: salesData, error: salesError } = await supabase
      .schema('analytics')
      .from('fact_sales')
      .select(`
        tenant_id,
        sales_date,
        sku,
        channel,
        qty,
        revenue,
        cost,
        warehouse_code,
        yyyymm,
        created_at
      `)
      .eq('tenant_id', tenant_id)
      .order('sales_date', { ascending: false })
      .limit(1000);

    if (salesError) {
      console.error('sales 데이터 조회 실패:', salesError);
      return NextResponse.json(
        { error: `데이터 조회 실패: ${salesError.message}` },
        { status: 500 }
      );
    }

    // 데이터 변환 (기존 API와 호환성 유지)
    const transformedData = salesData?.map((row: any) => ({
      id: `${row.sku}-${row.sales_date}`,
      tenant_id: row.tenant_id,
      sale_date: row.sales_date,
      barcode: row.sku,
      product_name: row.sku, // SKU를 product_name으로 사용
      sale_qty: row.qty,
      unit_price_krw: row.revenue ? row.revenue / row.qty : 0,
      revenue_krw: row.revenue || 0,
      channel: row.channel || 'unknown',
      stock_qty: 0, // 재고 정보는 별도로 관리 필요
      created_at: row.created_at,
      // analytics 스키마의 추가 정보들
      cost: row.cost,
      warehouse_code: row.warehouse_code,
      yyyymm: row.yyyymm
    })) || [];

    console.log(`analytics 스키마에서 ${transformedData.length}개 행 조회 완료`);

    return NextResponse.json({
      success: true,
      items: transformedData,  // data.data -> data.items로 변경
      total: transformedData.length,
      source: 'analytics.fact_sales'
    });

  } catch (error) {
    console.error('데이터 조회 중 오류:', error);
    return NextResponse.json(
      { error: `데이터 조회 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}` },
      { status: 500 }
    );
  }
}


