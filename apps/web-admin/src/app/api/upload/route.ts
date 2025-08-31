export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// CSV 파싱 함수들 (로컬 복사)
interface SelmateRow {
	product_name: string;
	option_name?: string;
	location_code?: string;
	on_hand?: number;
	extra: Record<string, any>;
	daily_qty: Record<string, number>;
}

interface SelmateCsvParseResult {
	valid: SelmateRow[];
	invalid: Record<string, any>[];
	metadata: {
		totalRows: number;
		dateColumns: string[];
		basicColumns: string[];
	}
}

function selmateCsvToJson(content: string): SelmateCsvParseResult {
	const lines = content.trim().split(/\r?\n/);
	if (lines.length === 0) return { valid: [], invalid: [], metadata: { totalRows: 0, dateColumns: [], basicColumns: [] } };
	
	const headers = lines[0].split(',').map(h => h.trim());
	
	// 컬럼 분류
	const basicColumns: string[] = [];
	const dateColumns: string[] = [];
	
	headers.forEach(header => {
		// 날짜 컬럼인지 확인 (YYYYMMDD 형식)
		if (/^\d{8}$/.test(header)) {
			dateColumns.push(header);
		} else {
			basicColumns.push(header);
		}
	});
	
	const valid: SelmateRow[] = [];
	const invalid: Record<string, any>[] = [];

	for (let i = 1; i < lines.length; i++) {
		try {
			const row = lines[i].split(',');
			const raw: Record<string, any> = {};
			
			// 기본 컬럼과 날짜 컬럼 분리
			headers.forEach((h, idx) => {
				if (dateColumns.includes(h)) {
					// 날짜 컬럼은 daily_qty에 포함
					const value = row[idx]?.trim() || '';
					if (value && value !== '0' && value !== '') {
						const numValue = parseFloat(value);
						if (!isNaN(numValue)) {
							raw[h] = numValue;
						}
					}
				} else {
					// 기본 컬럼
					raw[h] = row[idx]?.trim() || '';
				}
			});

			// daily_qty JSONB 생성
			const daily_qty: Record<string, number> = {};
			dateColumns.forEach(dateCol => {
				if (raw[dateCol] !== undefined && raw[dateCol] > 0) {
					daily_qty[dateCol] = raw[dateCol];
				}
			});

			// 상품명 찾기 (여러 가능한 컬럼명 시도)
			let productName = '';
			const possibleProductColumns = ['사입상품명', '상품명', '제품명', '상품'];
			for (const col of possibleProductColumns) {
				if (raw[col] && raw[col].trim()) {
					productName = raw[col].trim();
					break;
				}
			}

			// 기본 정보 추출
			const candidate = {
				product_name: productName,
				option_name: raw['옵션내용'] || raw['옵션코드'] || undefined,
				location_code: raw['상품위치'] || undefined,
				on_hand: parseFloat(raw['현재고'] || '0') || 0,
				extra: {
					바코드번호: raw['바코드번호'] || '',
					상품코드: raw['상품코드'] || '',
					상품분류: raw['상품분류'] || '',
					브랜드: raw['브랜드'] || '',
					공급처명: raw['공급처명'] || '',
					원가: raw['원가'] || '',
					판매가: raw['판매가'] || '',
					품절여부: raw['품절여부'] || '',
					안정재고: raw['안정재고'] || ''
				},
				daily_qty
			};
			
			// 상품명이 없으면 건너뛰기
			if (!candidate.product_name) {
				continue;
			}
			
			valid.push(candidate);
		} catch (rowError) {
			invalid.push({ error: 'Row processing failed', rowIndex: i });
		}
	}
	
	return { 
		valid, 
		invalid, 
		metadata: {
			totalRows: lines.length - 1,
			dateColumns,
			basicColumns
		}
	};
}

function csvToJson(content: string): any[] {
	const lines = content.trim().split(/\r?\n/);
	if (lines.length === 0) return [];
	
	const headers = lines[0].split(',').map(h => h.trim());
	const result: any[] = [];
	
	for (let i = 1; i < lines.length; i++) {
		try {
			const row = lines[i].split(',');
			const item: any = {};
			
			headers.forEach((header, idx) => {
				item[header] = row[idx]?.trim() || '';
			});
			
			result.push(item);
		} catch (rowError) {
			console.error(`Error processing row ${i}:`, rowError);
		}
	}
	
	return result;
}


// 파일 형식 감지 함수
function detectFileFormat(headers: string[]): 'selmate' | 'standard' {
	console.log('🔍 detectFileFormat - Headers:', headers);
	
	// 100데이터 분석.csv 형식: 대표판매가, 상품코드, 상품명, 상품등록일자 등이 있는지 확인
	const has100DataColumns = headers.some(header => 
		['대표판매가', '상품코드', '상품명', '상품등록일자', '사입상품명', '옵션내용'].includes(header.trim())
	);
	
	console.log('🔍 has100DataColumns:', has100DataColumns);
	console.log('🔍 Looking for:', ['대표판매가', '상품코드', '상품명', '상품등록일자', '사입상품명', '옵션내용']);
	
	// Selmate 형식: 날짜 컬럼이 YYYYMMDD 형식으로 있는지 확인
	const hasDateColumns = headers.some(header => /^\d{8}$/.test(header.trim()));
	const hasSelmateColumns = headers.some(header => 
		['사입상품명', '바코드번호', '현재고', '상품위치'].includes(header.trim())
	);
	
	console.log('🔍 hasDateColumns:', hasDateColumns);
	console.log('🔍 hasSelmateColumns:', hasSelmateColumns);
	
	// 100데이터 분석.csv가 우선순위
	if (has100DataColumns) {
		console.log('✅ 100데이터 분석.csv 형식으로 감지됨 -> standard 반환');
		return 'standard'; // unified API로 처리
	}
	
	if (hasDateColumns && hasSelmateColumns) {
		console.log('✅ Selmate 형식으로 감지됨 -> selmate 반환');
		return 'selmate';
	}
	
	console.log('✅ 기본 형식으로 감지됨 -> standard 반환');
	return 'standard';
}

export async function POST(req: Request) {
	try {
		const form = await req.formData();
		const file = form.get('file');
		const tenantId = String(form.get('tenant_id') || '');
		
		console.log('Upload request - tenant_id:', tenantId);
		console.log('File info:', file ? { name: (file as File).name, size: (file as File).size, type: (file as File).type } : 'No file');
		
		if (!file || !(file instanceof File)) {
			return NextResponse.json({ error: 'file required' }, { status: 400 });
		}
		if (!tenantId) {
			return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
		}

		const text = await file.text();
		console.log('File content preview:', text.substring(0, 200) + '...');
		
		const lines = text.trim().split(/\r?\n/);
		if (lines.length === 0) {
			return NextResponse.json({ error: 'Empty file' }, { status: 400 });
		}
		
		const headers = lines[0].split(',').map(h => h.trim());
		const fileFormat = detectFileFormat(headers);
		
		console.log('Detected file format:', fileFormat);
		console.log('Headers:', headers);
		
		let result: any;
		
		if (fileFormat === 'selmate') {
			// Selmate CSV 처리
			console.log('Processing as Selmate CSV...');
			const selmateResult = selmateCsvToJson(text);
			
			if (selmateResult.valid.length === 0) {
				return NextResponse.json({ 
					error: 'No valid Selmate rows found', 
					metadata: selmateResult.metadata,
					invalidCount: selmateResult.invalid.length 
				}, { status: 400 });
			}
			
			// Selmate 데이터를 기존 items 테이블 형식으로 변환
			const items = selmateResult.valid.map(row => ({
				barcode: row.extra.바코드번호 || '',
				productName: row.product_name,
				qty: row.on_hand || 0,
				tenant_id: tenantId,
				// 추가 정보를 JSONB로 저장
				metadata: {
					selmate_format: true,
					option_name: row.option_name,
					location_code: row.location_code,
					category: row.extra.상품분류,
					brand: row.extra.브랜드,
					supplier: row.extra.공급처명,
					cost: row.extra.원가,
					price: row.extra.판매가,
					discontinued: row.extra.품절여부,
					safety_stock: row.extra.안정재고,
					daily_qty: row.daily_qty
				}
			}));
			
			result = {
				valid: items,
				invalid: selmateResult.invalid,
				metadata: selmateResult.metadata,
				format: 'selmate'
			};
			
		} else {
			// 일반 CSV 처리
			console.log('Processing as standard CSV...');

			type CsvRecord = Record<string, unknown>;
			type CsvParseResult =
			  | { valid: CsvRecord[]; invalid: CsvRecord[] }
			  | CsvRecord[];

			/** 두 가지 반환 형태를 모두 {valid, invalid}로 통일 */
			const normalizeCsvResult = (
			  res: CsvParseResult
			): { valid: CsvRecord[]; invalid: CsvRecord[] } => {
			  if (Array.isArray(res)) return { valid: res, invalid: [] };
			  const v = Array.isArray(res.valid) ? res.valid : [];
			  const i = Array.isArray(res.invalid) ? res.invalid : [];
			  return { valid: v, invalid: i };
			};

			const parsed = csvToJson(text) as CsvParseResult;
			const { valid, invalid } = normalizeCsvResult(parsed);
			
			if (valid.length === 0) {
				return NextResponse.json({ 
					error: 'No valid standard rows found',
					invalidCount: invalid.length 
				}, { status: 400 });
			}
			
			// enforce tenant on valid
			const items = valid.map(v => ({ ...v, tenant_id: tenantId }));
			
			result = {
				valid: items,
				invalid: invalid,
				format: 'standard'
			};
		}
		
		console.log('CSV parsing result:', { 
			valid: result.valid.length, 
			invalid: result.invalid.length,
			format: result.format
		});
		
		const supabase = createServerClient();
		let inserted = 0;
		let updated = 0;

		for (const chunk of chunkArray(result.valid, 500)) {
			// 1차: 객체 배열 그대로(jsonb 파라미터 자동 직렬화)
			let { data, error } = await supabase.rpc('upsert_items', { _items: chunk as any });
			// 일부 환경에서 jsonb 파라미터 캐스팅 문제 → 문자열로 재시도
			if (error || !data) {
				console.log('First attempt failed, retrying with JSON string...');
				const retry = await supabase.rpc('upsert_items', { _items: JSON.stringify(chunk) as any });
				data = retry.data as any;
				if (retry.error) throw retry.error;
			}
			const row = Array.isArray(data) ? (data[0] as any) : (data as any);
			inserted += Number(row?.inserted ?? 0);
			updated += Number(row?.updated ?? 0);
		}

		console.log('Final result:', { inserted, updated, invalidCount: result.invalid.length, format: result.format });
		return NextResponse.json({ 
			inserted, 
			updated, 
			invalidCount: result.invalid.length,
			format: result.format,
			metadata: result.metadata
		});
	} catch (e: any) {
		console.error('Upload error:', e);
		return NextResponse.json({ error: e?.message || 'upload failed' }, { status: 500 });
	}
}

function createServerClient() {
	const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
	if (!url) throw new Error('supabaseUrl is required.');
	if (!serviceKey) throw new Error('supabase service key is required.');
	return createClient(url, serviceKey);
}

function chunkArray<T>(arr: T[], size: number): T[][] {
	const out: T[][] = [];
	for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
	return out;
}
