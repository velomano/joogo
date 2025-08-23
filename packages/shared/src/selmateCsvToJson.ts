import { z } from 'zod';

// Selmate CSV 행 스키마
export const SelmateRowSchema = z.object({
	product_name: z.string().min(1),
	option_name: z.string().optional(),
	location_code: z.string().optional(),
	on_hand: z.number().optional(),
	extra: z.record(z.any()).default({}),
	daily_qty: z.record(z.number()).default({})
});

export type SelmateRow = z.infer<typeof SelmateRowSchema>;

export interface SelmateCsvParseResult {
	valid: SelmateRow[];
	invalid: Record<string, any>[];
	metadata: {
		totalRows: number;
		dateColumns: string[];
		basicColumns: string[];
	}
}

// Selmate CSV 전용 파싱 함수
export function selmateCsvToJson(content: string, defaultTenantId: string = 'default'): SelmateCsvParseResult {
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
	
	console.log('Selmate CSV Headers:', headers);
	console.log('Basic columns:', basicColumns);
	console.log('Date columns:', dateColumns);
	
	const valid: SelmateRow[] = [];
	const invalid: Record<string, any>[] = [];

	for (let i = 1; i < lines.length; i++) {
		try {
			const row = splitCsvLine(lines[i]);
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
				console.log('Skipping row - no product name found:', raw);
				continue;
			}
			
			const parsed = SelmateRowSchema.safeParse(candidate);
			if (parsed.success) {
				valid.push(parsed.data);
			} else {
				console.log('Invalid row:', candidate, 'Error:', parsed.error);
				invalid.push(raw);
			}
		} catch (rowError) {
			console.error(`Error processing row ${i}:`, rowError);
			invalid.push({ error: 'Row processing failed', rowIndex: i });
		}
	}
	
	console.log(`Parsed ${valid.length} valid rows, ${invalid.length} invalid rows`);
	if (dateColumns.length > 0) {
		console.log(`Date range: ${dateColumns[0]} ~ ${dateColumns[dateColumns.length - 1]}`);
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

function splitCsvLine(line: string): string[] {
	// CSV 라인 분할 (따옴표 지원)
	const res: string[] = [];
	let cur = '';
	let inQ = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			inQ = !inQ;
			continue;
		}
		if (ch === ',' && !inQ) {
			res.push(cur);
			cur = '';
		} else {
			cur += ch;
		}
	}
	res.push(cur);
	return res;
}
