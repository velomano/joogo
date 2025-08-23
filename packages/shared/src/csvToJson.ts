import { ItemSchema, Item } from './schemas/item';

export type RawRow = Record<string, string>;

export interface CsvParseResult {
	valid: Item[];
	invalid: RawRow[];
}

// 헤더 매핑 함수 추가
function mapHeaders(headers: string[]): { [key: string]: string } {
	const mapping: { [key: string]: string } = {};
	
	headers.forEach(header => {
		const cleanHeader = header.trim().toLowerCase();
		
		// 바코드 관련 헤더들
		if (cleanHeader.includes('바코드') || cleanHeader.includes('barcode') || cleanHeader.includes('sku') || 
			cleanHeader.includes('상품코드') || cleanHeader.includes('product') || cleanHeader.includes('code') ||
			cleanHeader.includes('바코드번호')) {
			mapping.barcode = header;
		}
		// 상품명 관련 헤더들
		else if (cleanHeader.includes('상품명') || cleanHeader.includes('product') || cleanHeader.includes('name') || 
				cleanHeader.includes('제품명') || cleanHeader.includes('상품') || cleanHeader.includes('item') ||
				cleanHeader.includes('사입상품명')) {
			mapping.productName = header;
		}
		// 수량 관련 헤더들
		else if (cleanHeader.includes('수량') || cleanHeader.includes('qty') || cleanHeader.includes('quantity') || 
				cleanHeader.includes('개수') || cleanHeader.includes('재고') || cleanHeader.includes('stock') ||
				cleanHeader.includes('재고수량') || cleanHeader.includes('현재고')) {
			mapping.qty = header;
		}
		// 테넌트 ID 관련 헤더들
		else if (cleanHeader.includes('tenant') || cleanHeader.includes('회사') || cleanHeader.includes('company') ||
				cleanHeader.includes('회사id') || cleanHeader.includes('tenant_id') || cleanHeader.includes('tenantid') ||
				cleanHeader.includes('테넌트') || cleanHeader.includes('회사id')) {
			mapping.tenant_id = header;
		}
	});
	
	return mapping;
}

export function csvToJson(content: string, defaultTenantId: string = 'default'): CsvParseResult {
	const lines = content.trim().split(/\r?\n/);
	if (lines.length === 0) return { valid: [], invalid: [] };
	
	const headers = lines[0].split(',').map(h => h.trim());
	const headerMapping = mapHeaders(headers);
	
	console.log('CSV Headers:', headers);
	console.log('Header Mapping:', headerMapping);
	
	// 필수 헤더가 없으면 빈 결과 반환
	if (!headerMapping.barcode || !headerMapping.productName || !headerMapping.qty) {
		console.warn('Required headers not found. Found headers:', headers);
		return { valid: [], invalid: [] };
	}
	
	const valid: Item[] = [];
	const invalid: RawRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const row = splitCsvLine(lines[i]);
		const raw: RawRow = {};
		headers.forEach((h, idx) => (raw[h] = (row[idx] ?? '').trim()));

		// 매핑된 헤더를 사용하여 데이터 추출
		const candidate = {
			barcode: raw[headerMapping.barcode] || '',
			productName: raw[headerMapping.productName] || '',
			qty: toNumber(raw[headerMapping.qty]),
			tenant_id: raw[headerMapping.tenant_id] || defaultTenantId, // 기본값 사용
		};
		
		const parsed = ItemSchema.safeParse(candidate);
		if (parsed.success) {
			valid.push(parsed.data);
		} else {
			console.log('Invalid row:', candidate, 'Error:', parsed.error);
			invalid.push(raw);
		}
	}
	
	console.log(`Parsed ${valid.length} valid rows, ${invalid.length} invalid rows`);
	return { valid, invalid };
}

function toNumber(v?: string): number {
	if (!v) return NaN;
	const n = Number(v);
	return Number.isFinite(n) ? n : NaN;
}

function splitCsvLine(line: string): string[] {
	// naive CSV split with quotes support
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
