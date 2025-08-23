// SQL 템플릿 라이브러리
// 목표: 미리 정의된 SQL로 토큰 사용량 최소화

interface SQLTemplate {
  sql: string;
  columns: string[];
  limit: number;
  description: string;
}

interface BuiltSQL {
  sql: string;
  columns: string[];
  params: Record<string, any>;
}

// 공통 의도별 SQL 템플릿
export const TEMPLATES: Record<string, SQLTemplate> = {
  monthly_summary: {
    sql: `
      SELECT 
        DATE_TRUNC('month', order_date) as month,
        COUNT(DISTINCT order_id) as order_count,
        SUM(total_price) as total_sales,
        AVG(total_price) as avg_order_value
      FROM core.sales 
      WHERE tenant_id = $1 
      GROUP BY DATE_TRUNC('month', order_date)
      ORDER BY month DESC
      LIMIT $2
    `,
    columns: ['month', 'order_count', 'total_sales', 'avg_order_value'],
    limit: 12,
    description: '월별 매출 요약'
  },
  
  top_sku_days: {
    sql: `
      SELECT 
        sku,
        COUNT(DISTINCT order_id) as order_count,
        SUM(total_price) as total_sales,
        SUM(qty) as total_qty
      FROM core.sales 
      WHERE tenant_id = $1 
        AND order_date >= NOW() - INTERVAL '$2 days'
      GROUP BY sku
      ORDER BY total_sales DESC
      LIMIT $3
    `,
    columns: ['sku', 'order_count', 'total_sales', 'total_qty'],
    limit: 20,
    description: '최근 N일 Top SKU'
  },
  
  recent_sales: {
    sql: `
      SELECT 
        order_date,
        sku,
        qty,
        total_price,
        order_id
      FROM core.sales 
      WHERE tenant_id = $1 
      ORDER BY order_date DESC
      LIMIT $2
    `,
    columns: ['order_date', 'sku', 'qty', 'total_price', 'order_id'],
    limit: 50,
    description: '최근 거래 내역'
  },
  
  sku_trend: {
    sql: `
      SELECT 
        DATE_TRUNC('day', order_date) as order_date,
        sku,
        SUM(qty) as daily_qty,
        SUM(total_price) as daily_sales
      FROM core.sales 
      WHERE tenant_id = $1 
        AND sku = $2
        AND order_date >= NOW() - INTERVAL '$3 days'
      GROUP BY DATE_TRUNC('day', order_date), sku
      ORDER BY order_date DESC
      LIMIT $4
    `,
    columns: ['order_date', 'sku', 'daily_qty', 'daily_sales'],
    limit: 30,
    description: '특정 SKU 추세'
  },
  
  inventory_analysis: {
    sql: `
      SELECT 
        product_name,
        sku,
        qty,
        CASE 
          WHEN qty >= 50 THEN 'high'
          WHEN qty >= 10 THEN 'medium'
          WHEN qty > 0 THEN 'low'
          ELSE 'zero'
        END as stock_level
      FROM core.items 
      WHERE tenant_id = $1 
      ORDER BY qty DESC
      LIMIT $2
    `,
    columns: ['product_name', 'sku', 'qty', 'stock_level'],
    limit: 100,
    description: '재고 현황 분석'
  },
  
  product_analysis: {
    sql: `
      SELECT 
        product_name,
        sku,
        qty,
        total_price,
        order_date
      FROM core.sales s
      JOIN core.items i ON s.sku = i.sku AND s.tenant_id = i.tenant_id
      WHERE s.tenant_id = $1 
        AND (
          $2 = '' OR 
          i.product_name ILIKE '%' || $2 || '%' OR
          s.sku ILIKE '%' || $2 || '%'
        )
      ORDER BY order_date DESC
      LIMIT $3
    `,
    columns: ['product_name', 'sku', 'qty', 'total_price', 'order_date'],
    limit: 50,
    description: '상품별 분석'
  }
};

// SQL 빌더
export function buildSQL(intent: string, slots: Record<string, any>): BuiltSQL {
  const template = TEMPLATES[intent];
  if (!template) {
    throw new Error(`Unknown intent: ${intent}`);
  }
  
  // 기본 파라미터
  const params: Record<string, any> = {
    tenantId: slots.tenantId,
    limit: Math.min(slots.limit || template.limit, template.limit)
  };
  
  // 의도별 추가 파라미터
  switch (intent) {
    case 'top_sku_days':
      params.days = slots.days || 30;
      break;
    case 'sku_trend':
      params.sku = slots.sku;
      params.days = slots.days || 30;
      break;
    case 'product_analysis':
      params.keyword = slots.keywords?.[0] || '';
      break;
  }
  
  return {
    sql: template.sql,
    columns: template.columns,
    params
  };
}

// 컬럼 화이트리스트 검증
export function validateColumns(intent: string, requestedColumns: string[]): string[] {
  const template = TEMPLATES[intent];
  if (!template) return [];
  
  return requestedColumns.filter(col => template.columns.includes(col));
}

// LIMIT 검증
export function validateLimit(intent: string, requestedLimit: number): number {
  const template = TEMPLATES[intent];
  if (!template) return 10;
  
  return Math.min(Math.max(1, requestedLimit), template.limit);
}


