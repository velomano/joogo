import { NextRequest, NextResponse } from 'next/server';
import { supaAdmin } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00';

    console.log('Inventory Alerts API called with search:', search);
    
    // public.fact_sales에서 재고 알림 데이터 조회
    const sb = supaAdmin();
    const { data: salesData, error: salesError } = await sb
      .from('fact_sales')
      .select(`
        sku,
        product_name,
        color,
        size,
        qty,
        revenue
      `)
      .eq('tenant_id', tenantId)
      .order('sku', { ascending: true });

    if (salesError) {
      console.error('Sales data error:', salesError);
      return NextResponse.json({
        success: true,
        data: [],
        total: 0
      });
    }

    // fact_sales 데이터를 재고 알림 형식으로 변환
    const alerts = (salesData || []).map(item => {
      const currentStock = 0; // 재고 수량은 0으로 설정
      const reorderPoint = 0;
      const avgDailySales = item.qty || 0;
      const daysUntilStockout = 0;
      const leadTimeDays = 0;
      
      let priority = 'low';
      if (currentStock === 0) priority = 'critical';
      else if (daysUntilStockout <= 1) priority = 'high';
      else if (daysUntilStockout <= 3) priority = 'medium';
      
      return {
        sku: item.sku || 'N/A',
        productName: item.product_name || `상품-${item.sku}`,
        category: item.sku?.split('-')[0] || 'OTHER',
        currentStock: currentStock,
        reorderPoint: reorderPoint,
        daysUntilStockout: daysUntilStockout,
        priority: priority,
        lastRestocked: '',
        supplier: '',
        estimatedDelivery: ''
      };
    });

    // 검색 필터링
    let filteredAlerts = alerts;
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredAlerts = alerts.filter(alert => 
        alert.sku.toLowerCase().includes(searchTerm) ||
        alert.productName.toLowerCase().includes(searchTerm) ||
        alert.category.toLowerCase().includes(searchTerm) ||
        (searchTerm === 'critical' && alert.priority === 'critical') ||
        (searchTerm === 'high' && alert.priority === 'high') ||
        (searchTerm === 'medium' && alert.priority === 'medium') ||
        (searchTerm === 'low' && alert.priority === 'low')
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length
    });
    
  } catch (error) {
    console.error('Inventory Alerts API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch inventory alerts data',
        data: []
      },
      { status: 500 }
    );
  }
}