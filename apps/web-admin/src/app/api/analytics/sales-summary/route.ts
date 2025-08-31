export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// ✅ 0 값도 보존하는 가격 추출 로직 (수정)
function extractPrice(metaData: any, originalData: any): { price: number | null, costPrice: number | null } {
  // 0 값도 보존하기 위해 nullish coalescing (??) 사용
  const price = metaData?.selling_price ?? metaData?.price ?? metaData?.['판매가'] ?? 
                originalData?.selling_price ?? originalData?.price ?? originalData?.['판매가'] ?? null;
  
  const costPrice = metaData?.cost_price ?? metaData?.['원가'] ?? 
                    originalData?.cost_price ?? originalData?.['원가'] ?? null;
  
  return { price, costPrice };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    
    if (!tenant_id) {
      return NextResponse.json({ error: 'tenant_id is required' }, { status: 400 });
    }

    // 환경변수 디버깅
    console.log('[DEBUG] Environment variables check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...'
    });

    // Supabase 클라이언트 생성 - 올바른 환경변수 사용
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[ERROR] Missing environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseKey: !!supabaseKey
      });
      return NextResponse.json({ 
        error: 'Supabase configuration missing',
        details: {
          hasUrl: !!supabaseUrl,
          hasKey: !!supabaseKey
        }
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    console.log('[DEBUG] Supabase client created successfully');

    let items: any[] = [];
    let salesItems: any[] = [];
    let totalCount = 0;
    
    try {
      // 전체 개수 확인
      const { count, error: countError } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant_id);
      
      if (countError) {
        console.warn('Count query failed:', countError.message);
        totalCount = 0;
      } else {
        totalCount = count || 0;
      }

      // 페이지네이션 방식으로 모든 데이터 수집 (PostgREST 제한 우회)
      let allItems: any[] = [];
      let offset = 0;
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batchData, error: batchError } = await supabase
          .from('items')
          .select('*')
          .eq('tenant_id', tenant_id)
          .order('qty', { ascending: false })
          .range(offset, offset + batchSize - 1);
        
        if (batchError) {
          console.warn(`Batch query failed at offset ${offset}:`, batchError.message);
          break;
        }
        
        if (!batchData || batchData.length === 0) {
          hasMore = false;
        } else {
          allItems = allItems.concat(batchData);
          offset += batchSize;
          
          // 배치 크기보다 적은 데이터가 반환되면 더 이상 데이터가 없음
          if (batchData.length < batchSize) {
            hasMore = false;
          }
        }
        
        // 무한 루프 방지
        if (offset > 100000) {
          console.warn('Safety limit reached, stopping pagination');
          break;
        }
      }
      
      items = allItems;
      console.log(`[sales-summary] Retrieved ${items.length} items via pagination (${Math.ceil(offset / batchSize)} batches)`);
      
    } catch (e) { 
      console.warn('Items table not found'); 
      items = [];
    }

    // sales 테이블에서 가격 정보가 있는 상품들 조회
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('barcode, product_name, option_name, unit_price, qty, sale_date')
        .eq('tenant_id', tenant_id)
        .not('unit_price', 'is', null)
        .order('sale_date', { ascending: false })
        .limit(100); // 최근 100개만 조회
      
      if (salesError) {
        console.warn('Sales query failed:', salesError.message);
        salesItems = [];
      } else {
        salesItems = salesData || [];
        console.log(`[sales-summary] Retrieved ${salesItems.length} sales items with price info`);
      }
    } catch (e) {
      console.warn('Sales table not found or query failed');
      salesItems = [];
    }

    // items 테이블의 meta JSONB에서 가격 정보 추출 시도
    console.log(`[DEBUG] Checking meta data for price info...`);
    const itemsWithPriceFromMeta = items.filter(item => {
      const meta = item.meta || {};
      return meta.selling_price || meta.price || meta['판매가'] || meta.cost_price || meta['원가'];
    });
    console.log(`[DEBUG] Found ${itemsWithPriceFromMeta.length} items with price info in meta`);
    
    if (itemsWithPriceFromMeta.length > 0) {
      console.log(`[DEBUG] Sample meta data:`, itemsWithPriceFromMeta[0].meta);
    }

    // 통계 계산
    const totalQuantity = items.reduce((sum, item) => sum + (item.qty || 0), 0);
    const averageQuantity = totalCount > 0 ? Math.round(totalQuantity / totalCount) : 0;
    const lowStockItems = items.filter(item => (item.qty || 0) < 10);
    const outOfStockItems = items.filter(item => (item.qty || 0) === 0);
    const sufficientStockItems = items.filter(item => (item.qty || 0) >= 50);

    // 일별 판매 데이터에서 실제 판매 통계 계산
    let totalSoldQty = 0;
    let totalSoldRevenue = 0;
    let totalSoldCost = 0;
    
    items.forEach(item => {
      const originalData = item.original_data || {};
      const dailyData = originalData.daily_data || {};
      
      if (Object.keys(dailyData).length > 0) {
        // 90일치 일별 판매 수량 합계
        const dailySales = Object.values(dailyData);
        const soldQty = dailySales.reduce((sum: number, qty: any) => sum + Number(qty || 0), 0);
        totalSoldQty += soldQty;
        
        // ✅ 가격 정보를 먼저 추출한 후 매출 계산
        const metaData = item.meta || {};
        const { price, costPrice } = extractPrice(metaData, originalData);
        
        // 판매 매출 계산 (판매 수량 × 판매가)
        if (price !== null && soldQty > 0) {
          totalSoldRevenue += Number(price) * soldQty;
        }
        
        // 판매 원가 계산 (판매 수량 × 원가)
        if (costPrice !== null && soldQty > 0) {
          totalSoldCost += Number(costPrice) * soldQty;
        }
      }
    });
    
    console.log(`[DEBUG] Sales calculation:`, {
      totalSoldQty,
      totalSoldRevenue,
      totalSoldCost,
      itemsWithDailyData: items.filter(item => item.original_data?.daily_data).length
    });

    // Top 10 재고 상품
    const topStockItems = items
      .sort((a, b) => (b.qty || 0) - (a.qty || 0))
      .slice(0, 10)
      .map(item => ({
        barcode: item.barcode,
        product_name: item.product_name || item.productname || '상품명 없음',
        qty: item.qty || 0,
        updated_at: item.updated_at
      }));

    // 부족 재고 상품 (10개 미만)
    const lowStockList = lowStockItems.map(item => ({
      barcode: item.barcode,
      product_name: item.product_name || item.productname || '상품명 없음',
      qty: item.qty || 0,
      status: (item.qty || 0) === 0 ? '품절' : '부족',
      updated_at: item.updated_at
    }));

          // 전체 상품 목록 (상태 포함 + 실제 컬럼 사용)
      const allItemsList = items.map(item => {
        // meta JSONB에서 가격 정보 추출 시도
        const metaData = item.meta || {};
        
        // 가격 정보: meta와 original_data 모두에서 추출 시도
        const originalData = item.original_data || {};
        
        // ✅ 인라인 가격 추출 함수 사용
        const { price, costPrice } = extractPrice(metaData, originalData);
        
        // ✅ 상세한 디버깅 로그 (가격 추출 과정 추적)
        if (items.indexOf(item) < 3) {
          console.log(`[DEBUG] Item ${item.barcode} price extraction details:`, {
            metaData_keys: Object.keys(metaData),
            metaData_selling_price: metaData?.selling_price,
            metaData_price: metaData?.price,
            originalData_keys: Object.keys(originalData),
            originalData_selling_price: originalData?.selling_price,
            originalData_price: originalData?.price,
            extracted_price: price,
            extracted_cost: costPrice,
            price_type: typeof price,
            cost_type: typeof costPrice
          });
        }
        
        // 옵션명: 직접 컬럼 우선, 없으면 meta에서 추출
        const optionName = item.option_name || item.option || metaData.option_name || metaData.option || null;
        
        // 상품명: 여러 컬럼에서 찾기
        const productName = item.product_name || item.name || item.productname || '상품명 없음';
        
        // 카테고리: 직접 컬럼 우선
        const category = item.product_category || metaData.category || metaData['상품분류'] || null;
        
        // 디버깅: 처음 3개 항목의 데이터 구조 로그
        if (items.indexOf(item) < 3) {
          console.log(`[DEBUG] Item ${item.barcode} direct fields:`, {
            option_name: item.option_name,
            option: item.option,
            product_name: item.product_name,
            name: item.name,
            sku: item.sku,
            meta_keys: Object.keys(metaData),
            original_data_keys: Object.keys(originalData)
          });
          
          // 가격 정보 디버깅
          console.log(`[DEBUG] Item ${item.barcode} price extraction:`, {
            meta_price: metaData.selling_price || metaData.price || metaData['판매가'],
            original_price: originalData.selling_price || originalData.price || originalData['판매가'],
            final_price: price,
            meta_cost: metaData.cost_price || metaData['원가'],
            original_cost: originalData.cost_price || originalData['원가'],
            final_cost: costPrice
          });
        }
        
        return {
          barcode: item.barcode,
          product_name: productName,
          option_name: optionName,
          qty: item.qty || 0,
          status: (item.qty || 0) === 0 ? '품절' : 
                  (item.qty || 0) < 10 ? '부족' : 
                  (item.qty || 0) >= 50 ? '충분' : '보통',
          updated_at: item.updated_at,
          // 가격 정보
          price: price,
          cost_price: costPrice,
          sku: item.sku,
          category: category,
          // meta 데이터 전체 (디버깅용)
          meta: item.meta
        };
      });

    return NextResponse.json({
      summary: {
        total_items: totalCount,
        total_quantity: totalQuantity,
        average_quantity: averageQuantity,
        low_stock_count: lowStockItems.length,
        out_of_stock_count: outOfStockItems.length,
        sufficient_stock_count: sufficientStockItems.length
      },
      sales_summary: {
        total_sold_qty: totalSoldQty,
        total_sold_revenue: totalSoldRevenue,
        total_sold_cost: totalSoldCost,
        total_sold_profit: totalSoldRevenue - totalSoldCost
      },
      top_stock_items: topStockItems,
      low_stock_items: lowStockList,
      all_items: allItemsList,
      sales_with_price: salesItems, // 가격 정보가 있는 판매 데이터
      tenant_id: tenant_id,
      retrieved_at: new Date().toISOString(),
      note: `전체 ${totalCount}개 상품의 통계 데이터입니다. (조회된 항목: ${items.length}개, 가격정보: ${salesItems.length}개, 일별판매데이터: ${items.filter(item => item.original_data?.daily_data).length}개)`
    });
    
  } catch (error: any) {
    console.error('Sales Summary API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sales summary' },
      { status: 500 }
    );
  }
}
