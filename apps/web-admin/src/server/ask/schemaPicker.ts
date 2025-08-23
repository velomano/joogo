// 스키마 선택기
// 목표: 의도별로 필요한 최소 스키마만 반환하여 토큰 사용량 최소화

interface SchemaInfo {
  tables: string[];
  columns: string[];
  description: string;
  sampleData?: any[];
}

// 의도별 최소 스키마 정의
const INTENT_SCHEMAS: Record<string, SchemaInfo> = {
  monthly_summary: {
    tables: ['core.sales'],
    columns: ['order_date', 'order_id', 'total_price'],
    description: '월별 매출 집계를 위한 기본 정보'
  },
  
  top_sku_days: {
    tables: ['core.sales'],
    columns: ['sku', 'order_date', 'order_id', 'total_price', 'qty'],
    description: '기간별 Top SKU 분석을 위한 정보'
  },
  
  recent_sales: {
    tables: ['core.sales'],
    columns: ['order_date', 'sku', 'qty', 'total_price', 'order_id'],
    description: '최근 거래 내역 조회'
  },
  
  sku_trend: {
    tables: ['core.sales'],
    columns: ['order_date', 'sku', 'qty', 'total_price'],
    description: '특정 SKU 추세 분석'
  },
  
  inventory_analysis: {
    tables: ['core.items'],
    columns: ['product_name', 'sku', 'qty'],
    description: '재고 현황 분석'
  },
  
  product_analysis: {
    tables: ['core.sales', 'core.items'],
    columns: ['product_name', 'sku', 'qty', 'total_price', 'order_date'],
    description: '상품별 분석 (JOIN 필요)'
  },
  
  summary_overview: {
    tables: ['core.sales', 'core.items'],
    columns: ['sku', 'qty', 'total_price', 'order_date', 'product_name'],
    description: '전체 요약 (모든 정보 필요)'
  }
};

// 의도별 최소 스키마 반환
export function getMinimalSchema(intent: string): SchemaInfo {
  const schema = INTENT_SCHEMAS[intent];
  if (!schema) {
    // 기본 스키마
    return {
      tables: ['core.sales'],
      columns: ['sku', 'total_price', 'order_date'],
      description: '기본 정보'
    };
  }
  
  return schema;
}

// 스키마 문서 문자열 생성 (토큰 최적화)
export function generateSchemaDoc(intent: string): string {
  const schema = getMinimalSchema(intent);
  
  // 최소한의 설명만 포함
  const doc = `Tables: ${schema.tables.join(', ')}
Columns: ${schema.columns.join(', ')}
Purpose: ${schema.description}`;
  
  return doc;
}

// 의도별 샘플 데이터 생성 (few-shot 예시 최소화)
export function getSampleData(intent: string): any[] {
  const schema = getMinimalSchema(intent);
  
  // 의도별 2개 예시만 제공 (토큰 절약)
  switch (intent) {
    case 'monthly_summary':
      return [
        { month: '2024-01', order_count: 150, total_sales: 1500000, avg_order_value: 10000 },
        { month: '2024-02', order_count: 180, total_sales: 1800000, avg_order_value: 10000 }
      ];
    
    case 'top_sku_days':
      return [
        { sku: 'SKU-1001', order_count: 25, total_sales: 250000, total_qty: 50 },
        { sku: 'SKU-1002', order_count: 20, total_sales: 200000, total_qty: 40 }
      ];
    
    case 'inventory_analysis':
      return [
        { product_name: 'Red T-Shirt', sku: 'SKU-1001', qty: 100, stock_level: 'high' },
        { product_name: 'Blue Hoodie', sku: 'SKU-1002', qty: 5, stock_level: 'low' }
      ];
    
    default:
      return [];
  }
}

// 스키마 검증
export function validateSchema(intent: string, requestedTables: string[], requestedColumns: string[]): {
  valid: boolean;
  missingTables: string[];
  missingColumns: string[];
} {
  const schema = getMinimalSchema(intent);
  
  const missingTables = schema.tables.filter(table => !requestedTables.includes(table));
  const missingColumns = schema.columns.filter(col => !requestedColumns.includes(col));
  
  return {
    valid: missingTables.length === 0 && missingColumns.length === 0,
    missingTables,
    missingColumns
  };
}


