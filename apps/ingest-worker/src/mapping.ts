import { createClient } from '@supabase/supabase-js';

export type NormalRow = {
  sales_date: string;
  sku: string;
  channel?: string | null;
  qty: number;
  revenue?: number | null;
  cost?: number | null;
  warehouse_code?: string | null;
  order_id?: string | null;
  customer_id?: string | null;
  region?: string | null;
  brand?: string | null;
  extras?: Record<string, unknown> | null;
};

// 표준 컬럼명 정의
const CANONICAL_COLUMNS = new Set([
  'date','region','channel','category','sku','qty',
  'unit_price','discount_rate','unit_cost','revenue',
  'tavg','spend','is_event'
]);

// 환경 변수 로드
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');

// .env 파일 직접 로드
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        process.env[key] = value;
      }
    }
  });
}

// Supabase 클라이언트 생성
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 헤더 정규화 함수
export function normalizeHeader(h: string): string {
  return h.normalize('NFKC').trim()
    .replace(/\s+/g,' ')
    .toLowerCase()
    .replace(/[^\w가-힣%/.-]/g,'_')        // 안전 치환
    .replace(/_+/g,'_')
    .replace(/^_|_$/g,'');
}

// 숫자/날짜 파서
export function toNum(v: any): number | undefined {
  if (v === '' || v == null) return undefined;
  const s = String(v).replace(/,/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export function toDateISO(v: any): string | null {
  const s = String(v).trim().replace(/[./]/g, '-');
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

// 휴리스틱 기본 매핑
function heuristicMapping(normalizedHeader: string): string | undefined {
  if (['date', '날짜'].some(k => normalizedHeader.includes(k))) return 'date';
  if (['region', '지역'].some(k => normalizedHeader.includes(k))) return 'region';
  if (['channel', '채널'].some(k => normalizedHeader.includes(k))) return 'channel';
  if (['category', '카테고리'].some(k => normalizedHeader.includes(k))) return 'category';
  if (['sku', '상품', '코드'].some(k => normalizedHeader.includes(k))) return 'sku';
  if (['qty', '수량', 'quantity'].some(k => normalizedHeader.includes(k))) return 'qty';
  if (['단가', 'unit_price', '가격'].some(k => normalizedHeader.includes(k))) return 'unit_price';
  if (['할인', 'discount'].some(k => normalizedHeader.includes(k))) return 'discount_rate';
  if (['원가', 'cost'].some(k => normalizedHeader.includes(k))) return 'unit_cost';
  if (['revenue', '매출', '금액'].some(k => normalizedHeader.includes(k))) return 'revenue';
  if (['tavg', '평균기온', '기온'].some(k => normalizedHeader.includes(k))) return 'tavg';
  if (['spend', '광고비'].some(k => normalizedHeader.includes(k))) return 'spend';
  if (['event', 'is_event'].some(k => normalizedHeader.includes(k))) return 'is_event';
  return undefined;
}

// DB 기반 헤더 매핑 조회
export async function buildHeaderMap(
  tenantId: string, 
  rawHeaders: string[]
): Promise<{
  finalHeaders: string[];
  hasRequired: boolean;
  mappingResult: Partial<Record<keyof NormalRow, number>>;
}> {
  try {
    // 1) 정규화
    const normalizedHeaders = rawHeaders.map(normalizeHeader);

    // 2) DB 매핑 조회 (tenant 우선 → 글로벌)
    const { data: tenantRows } = await supabase
      .from('csv_header_map')
      .select('alias, canonical')
      .in('alias', rawHeaders)
      .eq('tenant_id', tenantId);

    const { data: globalRows } = await supabase
      .from('csv_header_map')
      .select('alias, canonical')
      .in('alias', rawHeaders)
      .eq('tenant_id', '00000000-0000-0000-0000-000000000000');

    // 3) 매핑 테이블 구성
    const dbMap = new Map<string, string>();
    
    // tenant 매핑 추가
    if (tenantRows) {
      for (const row of tenantRows) {
        dbMap.set(normalizeHeader(row.alias), row.canonical);
      }
    }
    
    // global 매핑 추가 (tenant에 없는 것만)
    if (globalRows) {
      for (const row of globalRows) {
        const normalizedAlias = normalizeHeader(row.alias);
        if (!dbMap.has(normalizedAlias)) {
          dbMap.set(normalizedAlias, row.canonical);
        }
      }
    }

    // 4) 최종 매핑 (DB 매핑 → 휴리스틱 → 원본)
    const finalHeaders = normalizedHeaders.map(n => 
      dbMap.get(n) ?? heuristicMapping(n) ?? n
    );

    // 5) 필수 컬럼 검사
    const required = ['date', 'region', 'channel', 'sku', 'qty'];
    const hasRequired = required.every(r => finalHeaders.includes(r));

    // 6) 기존 NormalRow 형식으로 매핑 결과 생성
    const mappingResult: Partial<Record<keyof NormalRow, number>> = {};
    
    // 기존 필드 매핑
    const fieldMappings: Record<string, keyof NormalRow> = {
      'date': 'sales_date',
      'region': 'region',
      'channel': 'channel',
      'sku': 'sku',
      'qty': 'qty',
      'revenue': 'revenue',
      'unit_cost': 'cost',
      'warehouse_code': 'warehouse_code',
      'order_id': 'order_id',
      'customer_id': 'customer_id',
      'brand': 'brand'
    };

    finalHeaders.forEach((header, index) => {
      const field = fieldMappings[header];
      if (field) {
        mappingResult[field] = index;
      }
    });

    console.log(`[mapping] Headers mapped for tenant ${tenantId}:`, {
      original: rawHeaders,
      normalized: normalizedHeaders,
      final: finalHeaders,
      hasRequired,
      mappingResult
    });

    return { finalHeaders, hasRequired, mappingResult };

  } catch (error: any) {
    console.error('[mapping] Error building header map:', error);
    throw new Error(`Header mapping failed: ${error?.message || error}`);
  }
}

// 레거시 호환성을 위한 기존 함수
export function buildHeaderMapLegacy(headers: string[]) {
  const norm = headers.map(h => h.trim());
  const map: Partial<Record<keyof NormalRow, number>> = {};
  
  const synonyms: Record<keyof NormalRow, string[]> = {
    sales_date: ["sales_date", "date", "판매일", "거래일"],
    sku: ["sku", "barcode", "바코드", "상품코드"],
    channel: ["channel", "판매처", "채널"],
    qty: ["qty", "quantity", "판매수량", "수량"],
    revenue: ["revenue", "amount", "매출", "금액"],
    cost: ["cost", "원가"],
    warehouse_code: ["warehouse_code", "location", "창고", "센터위치"],
    order_id: ["order_id", "주문번호"],
    customer_id: ["customer_id", "고객번호", "수취인"],
    region: ["region", "지역"],
    brand: ["brand", "브랜드"],
    extras: []
  };

  for (const key of Object.keys(synonyms) as (keyof NormalRow)[]) {
    const cands = synonyms[key].map(s => s.toLowerCase());
    for (let i = 0; i < norm.length; i++) {
      const name = norm[i].toLowerCase();
      if (cands.includes(name)) { map[key] = i; break; }
    }
  }
  return map;
}


