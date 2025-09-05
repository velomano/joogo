import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sb = supaAdmin();
    const tenant = "84949b3c-2cb7-4c42-b9f9-d1f37d371e00";
    
    console.log('🔍 재고 데이터 디버깅 시작...');
    
    // 1. 전체 데이터 개수 확인
    const { count: totalCount } = await sb
      .schema('analytics')
      .from('fact_sales')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant);
    
    console.log('🔍 전체 fact_sales 레코드 수:', totalCount);
    
    // 2. original_data가 있는 레코드 확인
    const { count: withOriginalData } = await sb
      .schema('analytics')
      .from('fact_sales')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant)
      .not('original_data', 'is', null);
    
    console.log('🔍 original_data가 있는 레코드 수:', withOriginalData);
    
    // 3. 샘플 데이터 확인
    const { data: sampleData, error } = await sb
      .schema('analytics')
      .from('fact_sales')
      .select('sku, original_data')
      .eq('tenant_id', tenant)
      .not('original_data', 'is', null)
      .limit(3);
    
    if (error) {
      console.error('❌ 샘플 데이터 조회 오류:', error);
      return NextResponse.json({ ok: false, error: error.message });
    }
    
    console.log('🔍 샘플 데이터:', sampleData);
    
    // 4. SKU별 재고 데이터 확인
    const skus = ['SKU-001', 'SKU-002', 'SKU-003'];
    const { data: skuData, error: skuError } = await sb
      .schema('analytics')
      .from('fact_sales')
      .select('sku, original_data')
      .eq('tenant_id', tenant)
      .in('sku', skus)
      .not('original_data', 'is', null)
      .limit(5);
    
    if (skuError) {
      console.error('❌ SKU 데이터 조회 오류:', skuError);
    } else {
      console.log('🔍 SKU 데이터:', skuData);
    }
    
    return NextResponse.json({
      ok: true,
      totalCount,
      withOriginalData,
      sampleData,
      skuData
    });
  } catch (e: any) {
    console.error('❌ 디버깅 오류:', e?.message, e?.stack);
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status: 500 });
  }
}
