export interface SalesItem {
  id: string;
  barcode?: string | null;
  name?: string | null;
  optionName?: string | null;
  qty?: number | null;
  safeQty?: number | null;
  price?: number | null;
}

export interface FilterConfig {
  low: number;
  high: number;
}

export type StockStatus = 'ALL' | 'OUT' | 'LOW' | 'NORMAL' | 'PLENTY';
export type SortKey = 'qty' | 'price' | 'name';
export type SortDirection = 'asc' | 'desc';

export interface FilterParams {
  searchTerm: string;
  stockFilter: StockStatus;
  sortKey: SortKey;
  sortDir: SortDirection;
  thresholds: FilterConfig;
}

// 텍스트 정규화
export function normalizeText(s: unknown): string {
  if (s == null) return '';
  return String(s).trim().toLowerCase();
}

// 대소문자 구분 없는 포함 검사
export function includesI(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.toLowerCase());
}

// 재고 상태 판정
export function getStockStatus(item: SalesItem, config: FilterConfig): Exclude<StockStatus, 'ALL'> {
  const qty = item.qty ?? 0;
  const safeQty = item.safeQty;
  
  // 품절
  if (qty <= 0) return 'OUT';
  
  // safeQty가 있는 경우
  if (safeQty != null) {
    if (qty < safeQty) return 'LOW';
    return qty >= safeQty * 2 ? 'PLENTY' : 'NORMAL';
  }
  
  // 기본 임계값 사용
  if (qty <= config.low) return 'LOW';
  if (qty >= config.high) return 'PLENTY';
  return 'NORMAL';
}

// 안전한 비교 함수
export function compareBy<T>(
  key: keyof T,
  direction: SortDirection,
  nulls: 'first' | 'last' = 'first'
): (a: T, b: T) => number {
  return (a: T, b: T) => {
    const aVal = a[key];
    const bVal = b[key];
    
    // null/undefined 처리
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return nulls === 'first' ? -1 : 1;
    if (bVal == null) return nulls === 'first' ? 1 : -1;
    
    // 타입별 비교
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      const result = aVal.localeCompare(bVal);
      return direction === 'asc' ? result : -result;
    }
    
    return 0;
  };
}

// 메인 필터링 및 정렬 파이프라인
export function buildFilteredSorted(
  items: SalesItem[],
  params: FilterParams
): SalesItem[] {
  let filtered = [...items];
  
  // 1. 검색 필터
  if (params.searchTerm.trim()) {
    const query = params.searchTerm.trim();
    filtered = filtered.filter(item => 
      includesI(normalizeText(item.name), query) ||
      includesI(normalizeText(item.optionName), query) ||
      includesI(normalizeText(item.barcode), query)
    );
  }
  
  // 2. 재고 상태 필터
  if (params.stockFilter !== 'ALL') {
    filtered = filtered.filter(item => 
      getStockStatus(item, params.thresholds) === params.stockFilter
    );
  }
  
  // 3. 정렬
  filtered.sort(compareBy(params.sortKey, params.sortDir));
  
  return filtered;
}

// 기본 임계값
export const DEFAULT_THRESHOLDS: FilterConfig = {
  low: 5,
  high: 20
};


