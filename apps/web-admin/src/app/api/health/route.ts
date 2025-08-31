export const runtime = 'edge';

import { NextResponse } from 'next/server';

const targets = [
	{ key: 'files', portEnv: 'NEXT_PUBLIC_FILES_PORT', fallback: 7301 },
	{ key: 'catalog', portEnv: 'NEXT_PUBLIC_CATALOG_PORT', fallback: 7302 },
	{ key: 'orders', portEnv: 'NEXT_PUBLIC_ORDERS_PORT', fallback: 7303 },
	{ key: 'shipping', portEnv: 'NEXT_PUBLIC_SHIPPING_PORT', fallback: 7304 },
];

async function ping(url: string, timeoutMs = 3000): Promise<'OK' | 'DOWN'> {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: {
				Authorization: `Bearer ${process.env.DEV_TOKEN || 'dev-tenant'}`,
			},
		});
		return res.ok ? 'OK' : 'DOWN';
	} catch {
		return 'DOWN';
	} finally {
		clearTimeout(id);
	}
}

export async function GET() {
	const entries = await Promise.all(
		targets.map(async t => {
			const port = Number(process.env[t.portEnv] || t.fallback);
			const status = await ping(`http://localhost:${port}/health`);
			return [t.key, status] as const;
		})
	);

	const body = Object.fromEntries(entries);
	return NextResponse.json(body);
}

