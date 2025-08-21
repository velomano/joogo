import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { csvToJson } from '@joogo/shared/src/csvToJson';
import path from 'path';
import dotenv from 'dotenv';

// Load root .env for monorepo (apps/web-admin doesn't auto-load root env)
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const runtime = 'nodejs';

export async function POST(req: Request) {
	try {
		const form = await req.formData();
		const file = form.get('file');
		const tenantId = String(form.get('tenant_id') || '');
		if (!file || !(file instanceof File)) {
			return NextResponse.json({ error: 'file required' }, { status: 400 });
		}
		if (!tenantId) {
			return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });
		}

		const text = await file.text();
		const { valid, invalid } = csvToJson(text);
		// enforce tenant on valid
		const items = valid.map(v => ({ ...v, tenant_id: tenantId }));

		const supabase = createServerClient();
		let inserted = 0;
		let updated = 0;

		for (const chunk of chunkArray(items, 500)) {
			// 1차: 객체 배열 그대로(jsonb 파라미터 자동 직렬화)
			let { data, error } = await supabase.rpc('upsert_items', { _items: chunk as any });
			// 일부 환경에서 jsonb 파라미터 캐스팅 문제 → 문자열로 재시도
			if (error || !data) {
				const retry = await supabase.rpc('upsert_items', { _items: JSON.stringify(chunk) as any });
				data = retry.data as any;
				if (retry.error) throw retry.error;
			}
			const row = Array.isArray(data) ? (data[0] as any) : (data as any);
			inserted += Number(row?.inserted ?? 0);
			updated += Number(row?.updated ?? 0);
		}

		return NextResponse.json({ inserted, updated, invalidCount: invalid.length });
	} catch (e: any) {
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
