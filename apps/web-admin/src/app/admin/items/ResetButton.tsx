'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function ResetButton({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = async () => {
    const params = new URLSearchParams();
    if (tenantId) params.set('tenant_id', tenantId);
    await fetch(`/api/items?${params.toString()}`, { method: 'DELETE' });
    startTransition(() => router.refresh());
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="px-3 py-2 border rounded text-red-600 border-red-300 disabled:opacity-50"
      title="현재 테넌트의 items 데이터를 모두 삭제합니다"
    >
      {pending ? '리셋 중...' : '리셋'}
    </button>
  );
}


