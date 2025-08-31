export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Selmate CSV 파싱 함수 (로컬 복사)
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
import { v4 as uuidv4 } from 'uuid';
import { parse } from 'csv-parse/sync';
import { sha256Hex } from '../../../../lib/crypto';


export async function POST(req: Request): Promise<NextResponse> {
	try {
		const form = await req.formData();
		const file = form.get('file');
		const tenantId = String(form.get('tenant_id') || '');
		
		console.log('Selmate upload request - tenant_id:', tenantId);
		
		// 타입 가드로 File 객체인지 확인
		if (!file || !(file instanceof File)) {
			return NextResponse.json({ error: 'file required' }, { status: 400 });
		}
		
		// File 객체의 속성에 안전하게 접근
		console.log('File info:', { 
			name: file.name, 
			size: file.size, 
			type: file.type 
		});
		
		if (!tenantId) {
			return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
		}

		const text = await file.text();
		console.log('File content preview:', text.substring(0, 200) + '...');
		
		// Selmate CSV 파싱
		const { valid, invalid, metadata } = selmateCsvToJson(text);
		console.log('Selmate CSV parsing result:', { valid: valid.length, invalid: invalid.length, metadata });
		
		if (valid.length === 0) {
			return NextResponse.json({ 
				error: 'No valid rows found', 
				metadata,
				invalidCount: invalid.length 
			}, { status: 400 });
		}

		const supabase = createServerClient();
		
		// 1. 파일 메타데이터 저장
		const fileHash = await sha256Hex(text);
		const fileData = {
			tenant_id: tenantId,
			filename: file.name,
			columns: metadata.basicColumns,
			row_count: metadata.totalRows,
			sha256: fileHash,
			source_format: 'selmate_3m_wide_v1',
			template_version: 'v1'
		};
		
		const { data: fileRecord, error: fileError } = await supabase
			.from('raw.selmate_file')
			.insert(fileData)
			.select()
			.single();
			
		if (fileError) {
			console.error('File insert error:', fileError);
			return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
		}
		
		console.log('File saved with ID:', fileRecord.file_id);
		
		// 2. 각 행을 raw.selmate_row에 저장
		const rowsToInsert = valid.map((row, idx) => ({
			file_id: fileRecord.file_id,
			row_idx: idx + 1,
			product_name: row.product_name,
			option_name: row.option_name,
			location_code: row.location_code,
			on_hand: row.on_hand,
			extra: row.extra,
			daily_qty: row.daily_qty
		}));
		
		const { error: rowsError } = await supabase
			.from('raw.selmate_row')
			.insert(rowsToInsert);
			
		if (rowsError) {
			console.error('Rows insert error:', rowsError);
			return NextResponse.json({ error: 'Failed to save rows' }, { status: 500 });
		}
		
		// 3. 데이터 로딩 프로시저 실행
		try {
			const { error: loadError } = await supabase.rpc('fact.load_selmate_file', { 
				_file: fileRecord.file_id 
			});
			
			if (loadError) {
				console.error('Load procedure error:', loadError);
				// 프로시저 실패해도 raw 데이터는 저장됨
			}
		} catch (procError) {
			console.error('Procedure execution error:', procError);
		}
		
		console.log('Selmate upload completed successfully');
		return NextResponse.json({ 
			success: true,
			file_id: fileRecord.file_id,
			inserted: valid.length,
			invalidCount: invalid.length,
			metadata
		});
		
	} catch (e: any) {
		console.error('Selmate upload error:', e);
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







