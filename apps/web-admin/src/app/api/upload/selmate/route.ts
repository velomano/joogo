export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { selmateCsvToJson } from '@joogo/shared/src/selmateCsvToJson';
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







