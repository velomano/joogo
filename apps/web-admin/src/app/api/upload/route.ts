import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { csvToJson } from '@joogo/shared/src/csvToJson';
import { selmateCsvToJson } from '@joogo/shared/src/selmateCsvToJson';

export const runtime = 'nodejs';

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
			const { valid, invalid } = csvToJson(text);
			
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
