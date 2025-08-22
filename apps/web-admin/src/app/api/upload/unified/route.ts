import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env for monorepo
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const runtime = 'nodejs';

// CSV 헤더 검증
const REQUIRED_HEADERS = [
  'tenant_id', 'sale_date', 'barcode', '상품명', '옵션명', 
  'sale_qty', 'unit_price_krw', 'revenue_krw', 'channel', 'stock_qty'
];

// 타입 정의
type CsvRow = {
  tenant_id: string;
  sale_date: string;
  barcode: string;
  상품명: string;
  옵션명: string;
  sale_qty: string;
  unit_price_krw: string;
  revenue_krw: string;
  channel: string;
  stock_qty: string;
};

type NormalizedRow = {
  tenant_id: string;
  sale_date: string;
  barcode: string;
  productName: string;
  product_name: string;
  option_name: string;
  sale_qty: number;
  unit_price_krw: number;
  revenue_krw: number;
  channel: string;
  stock_qty: number;
};

type UploadResult = {
  ok: boolean;
  total: number;
  inserted: { sales: number; items: number };
  skipped: number;
  errors: Array<{ row: number; message: string }>;
  preview: any[];
};

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    const tenantId = String(form.get('tenantId') || '');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId required' }, { status: 400 });
    }

    // CSV 파싱
    const text = await file.text();
    const { rows, errors: parseErrors } = parseCsv(text);
    
    if (parseErrors.length > 0) {
      return NextResponse.json({ 
        error: 'CSV 파싱 실패', 
        details: parseErrors 
      }, { status: 400 });
    }

    // 헤더 검증
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV에 데이터가 없습니다' }, { status: 400 });
    }

    const headers = Object.keys(rows[0]);
    const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({ 
        error: `필수 헤더가 누락되었습니다: ${missingHeaders.join(', ')}` 
      }, { status: 400 });
    }

    // 데이터 정규화 및 검증
    const { normalizedRows, validationErrors } = validateAndNormalize(rows, tenantId);
    
    // Supabase 클라이언트 생성
    const supabase = createServerClient();
    
    // 데이터베이스 업로드
    const { salesInserted, itemsInserted, dbErrors } = await uploadToDatabase(
      supabase, 
      normalizedRows, 
      tenantId
    );

    // 모든 에러 통합
    const allErrors = [...validationErrors, ...dbErrors];
    
    // 결과 생성
    const result: UploadResult = {
      ok: true,
      total: rows.length,
      inserted: {
        sales: salesInserted,
        items: itemsInserted
      },
      skipped: allErrors.length,
      errors: allErrors.slice(0, 50), // 최대 50개 에러
      preview: normalizedRows.slice(0, 5).map(row => ({
        ...row,
        productName: `${row.option_name} ${row.product_name}`,
        sale_qty: row.sale_qty,
        unit_price_krw: row.unit_price_krw,
        revenue_krw: row.revenue_krw,
        channel: row.channel,
        stock_qty: row.stock_qty
      }))
    };

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: error?.message || '업로드 실패' 
    }, { status: 500 });
  }
}

// CSV 파싱 (BOM 제거 지원)
function parseCsv(text: string): { rows: any[]; errors: string[] } {
  const errors: string[] = [];
  const rows: any[] = [];
  
  try {
    // BOM 제거
    let cleanText = text;
    if (text.charCodeAt(0) === 0xFEFF) {
      cleanText = text.slice(1);
    }
    
    const lines = cleanText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      errors.push('헤더와 데이터가 필요합니다');
      return { rows, errors };
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataLines = lines.slice(1);
    
    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      if (values.length !== headers.length) {
        errors.push(`행 ${i + 2}: 컬럼 수가 맞지 않습니다 (${values.length}/${headers.length})`);
        continue;
      }
      
      const row: any = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });
      rows.push(row);
    }
    
  } catch (error) {
    errors.push(`CSV 파싱 오류: ${error}`);
  }
  
  return { rows, errors };
}

// 데이터 검증 및 정규화
function validateAndNormalize(
  rows: CsvRow[], 
  tenantId: string
): { normalizedRows: NormalizedRow[]; validationErrors: Array<{ row: number; message: string }> } {
  const normalizedRows: NormalizedRow[] = [];
  const validationErrors: Array<{ row: number; message: string }> = [];
  
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // 헤더 다음부터 시작
    
    try {
      // 날짜 검증
      const saleDate = row.sale_date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(saleDate)) {
        validationErrors.push({ row: rowNum, message: `잘못된 날짜 형식: ${saleDate}` });
        continue;
      }
      
      // 숫자 정규화
      const saleQty = parseNumber(row.sale_qty, 'sale_qty', rowNum, validationErrors);
      const unitPrice = parseNumber(row.unit_price_krw, 'unit_price_krw', rowNum, validationErrors);
      const revenue = parseNumber(row.revenue_krw, 'revenue_krw', rowNum, validationErrors);
      const stockQty = parseNumber(row.stock_qty, 'stock_qty', rowNum, validationErrors);
      
      if (saleQty === null || unitPrice === null || revenue === null || stockQty === null) {
        continue; // 에러가 이미 추가됨
      }
      
      // revenue가 비어있으면 계산
      const calculatedRevenue = revenue > 0 ? revenue : saleQty * unitPrice;
      
      // channel 검증
      const validChannels = ['online', 'offline', 'wholesale', 'snapshot'];
      if (!validChannels.includes(row.channel)) {
        validationErrors.push({ 
          row: rowNum, 
          message: `잘못된 channel: ${row.channel} (${validChannels.join(', ')} 중 하나여야 함)` 
        });
        continue;
      }
      
      // 판매행/스냅샷행 검증
      if (saleQty > 0 && row.channel === 'snapshot') {
        validationErrors.push({ 
          row: rowNum, 
          message: '판매행(sale_qty > 0)은 channel이 snapshot이 될 수 없습니다' 
        });
        continue;
      }
      
      if (saleQty === 0 && row.channel !== 'snapshot') {
        validationErrors.push({ 
          row: rowNum, 
          message: '스냅샷행(sale_qty = 0)은 channel이 snapshot이어야 합니다' 
        });
        continue;
      }
      
      // 정규화된 행 생성
      const normalizedRow: NormalizedRow = {
        tenant_id: tenantId, // 폼의 tenantId로 오버라이드
        sale_date: saleDate,
        barcode: row.barcode,
        productName: `${row.옵션명} ${row.상품명}`.trim(),
        product_name: row.상품명,
        option_name: row.옵션명,
        sale_qty: saleQty,
        unit_price_krw: unitPrice,
        revenue_krw: calculatedRevenue,
        channel: row.channel,
        stock_qty: stockQty
      };
      
      normalizedRows.push(normalizedRow);
      
    } catch (error) {
      validationErrors.push({ 
        row: rowNum, 
        message: `처리 중 오류: ${error}` 
      });
    }
  }
  
  return { normalizedRows, validationErrors };
}

// 숫자 파싱 헬퍼
function parseNumber(
  value: string, 
  fieldName: string, 
  rowNum: number, 
  errors: Array<{ row: number; message: string }>
): number | null {
  try {
    // 쉼표와 원 기호 제거
    const cleanValue = value.replace(/[,₩원]/g, '');
    const num = parseInt(cleanValue, 10);
    
    if (isNaN(num) || num < 0) {
      errors.push({ 
        row: rowNum, 
        message: `${fieldName}는 0 이상의 정수여야 합니다: ${value}` 
      });
      return null;
    }
    
    return num;
  } catch (error) {
    errors.push({ 
      row: rowNum, 
      message: `${fieldName} 파싱 실패: ${value}` 
    });
    return null;
  }
}

// 데이터베이스 업로드
async function uploadToDatabase(
  supabase: any, 
  rows: NormalizedRow[], 
  tenantId: string
): Promise<{ salesInserted: number; itemsInserted: number; dbErrors: Array<{ row: number; message: string }> }> {
  let salesInserted = 0;
  let itemsInserted = 0;
  const dbErrors: Array<{ row: number; message: string }> = [];
  
  // 판매행과 스냅샷행 분리
  const salesRows = rows.filter(row => row.sale_qty > 0);
  const snapshotRows = rows.filter(row => row.sale_qty === 0 && row.channel === 'snapshot');
  
  console.log('Upload Debug:', {
    totalRows: rows.length,
    salesRows: salesRows.length,
    snapshotRows: snapshotRows.length,
    sampleSnapshot: snapshotRows.slice(0, 3)
  });
  
  // 판매 데이터 업로드
  if (salesRows.length > 0) {
    try {
              const { data, error } = await supabase
          .from('sales')
          .upsert(
            salesRows.map(row => ({
              tenant_id: row.tenant_id,
              sale_date: row.sale_date,
              barcode: row.barcode,
              productname: row.productName,
              product_name: row.product_name,
              option_name: row.option_name,
              qty: row.sale_qty,
              unit_price: row.unit_price_krw,
              revenue: row.revenue_krw,
              channel: row.channel
            })),
            {
              onConflict: 'tenant_id,sale_date,barcode,channel,unit_price'
            }
          );
      
      if (error) throw error;
      salesInserted = salesRows.length;
      
    } catch (error: any) {
      console.error('Sales upload error:', error);
      salesRows.forEach((_, idx) => {
        dbErrors.push({ 
          row: idx + 1, 
          message: `판매 데이터 업로드 실패: ${error?.message || 'Unknown error'}` 
        });
      });
    }
  }
  
  // 재고 스냅샷 업로드
  if (snapshotRows.length > 0) {
    try {
              // 중복 제거: 같은 barcode는 마지막 값으로 덮어쓰기
        const uniqueItems = new Map();
        snapshotRows.forEach(row => {
          const key = `${row.tenant_id}-${row.barcode}`;
          uniqueItems.set(key, row);
        });
        
        const deduplicatedRows = Array.from(uniqueItems.values());
        
        const { data, error } = await supabase
          .from('items')
          .upsert(
            deduplicatedRows.map(row => ({
              tenant_id: row.tenant_id,
              barcode: row.barcode,
              productname: row.productName,
              product_name: row.product_name,
              option_name: row.option_name,
              qty: row.stock_qty,
              sale_date: row.sale_date,
              unit_price_krw: row.unit_price_krw,
              revenue_krw: row.revenue_krw,
              channel: row.channel,
              created_at: new Date().toISOString()
            })),
            {
              onConflict: 'tenant_id,barcode'
            }
          );
      
      if (error) throw error;
      itemsInserted = snapshotRows.length;
      
    } catch (error: any) {
      console.error('Items upload error:', error);
      snapshotRows.forEach((_, idx) => {
        dbErrors.push({ 
          row: idx + 1, 
          message: `재고 데이터 업로드 실패: ${error?.message || 'Unknown error'}` 
        });
      });
    }
  }
  
  return { salesInserted, itemsInserted, dbErrors };
}

// Supabase 클라이언트 생성
function createServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url) throw new Error('SUPABASE_URL is required');
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE is required');
  
  return createClient(url, serviceKey);
}
