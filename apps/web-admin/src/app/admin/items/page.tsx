import Link from 'next/link';
import { headers } from 'next/headers';
import ResetButton from './ResetButton';

function getBaseUrl(): string {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const h = headers();
  const proto = h.get('x-forwarded-proto') ?? 'http';
  const host = h.get('host') ?? 'localhost:3000';
  return `${proto}://${host}`;
}

async function fetchItems(tenantId: string) {
  const params = new URLSearchParams();
  if (tenantId) params.set('tenant_id', tenantId);
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/items?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) return { items: [] } as any;
  return res.json();
}

export default async function ItemsPage({ searchParams }: { searchParams?: { tenant_id?: string } }) {
  const tenantId = searchParams?.tenant_id || process.env.NEXT_PUBLIC_TENANT_ID || '';
  const data = await fetchItems(tenantId);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Items</h1>
        <div className="flex gap-2">
          <Link href="/admin/items/upload" className="px-3 py-2 border rounded">CSV 업로드</Link>
          <ResetButton tenantId={tenantId} />
        </div>
      </div>

      <form action="/admin/items" method="get" className="flex gap-2">
        <input name="tenant_id" defaultValue={tenantId} className="border rounded px-3 py-2 w-[420px]" placeholder="tenant uuid" />
        <button className="px-3 py-2 bg-gray-800 text-white rounded">조회</button>
      </form>

      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">barcode</th>
              <th className="text-left px-3 py-2">product_name</th>
              <th className="text-left px-3 py-2">qty</th>
              <th className="text-left px-3 py-2">updated_at</th>
            </tr>
          </thead>
          <tbody>
            {data.items?.map((r: any, i: number) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 font-mono">{r.barcode}</td>
                <td className="px-3 py-2">{r.product_name}</td>
                <td className="px-3 py-2">{r.qty}</td>
                <td className="px-3 py-2">{r.updated_at}</td>
              </tr>
            ))}
            {!data.items?.length && (
              <tr>
                <td className="px-3 py-6 text-center text-gray-500" colSpan={4}>No items</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


