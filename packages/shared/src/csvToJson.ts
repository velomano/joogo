import { ItemSchema, Item } from './schemas/item';

export type RawRow = Record<string, string>;

export interface CsvParseResult {
	valid: Item[];
	invalid: RawRow[];
}

export function csvToJson(content: string): CsvParseResult {
	const lines = content.trim().split(/\r?\n/);
	if (lines.length === 0) return { valid: [], invalid: [] };
	const headers = lines[0].split(',').map(h => h.trim());
	const valid: Item[] = [];
	const invalid: RawRow[] = [];

	for (let i = 1; i < lines.length; i++) {
		const row = splitCsvLine(lines[i]);
		const raw: RawRow = {};
		headers.forEach((h, idx) => (raw[h] = (row[idx] ?? '').trim()));

		// coerce types for validation
		const candidate = {
			barcode: raw.barcode,
			productName: raw.productName,
			qty: toNumber(raw.qty),
			tenant_id: raw.tenant_id,
		};
		const parsed = ItemSchema.safeParse(candidate);
		if (parsed.success) valid.push(parsed.data);
		else invalid.push(raw);
	}
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
