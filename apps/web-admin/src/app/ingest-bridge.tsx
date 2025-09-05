'use client';
import { useIngestSync } from '@/lib/useIngestSync';

// 서버에서 받은 tenantId를 props로 넘깁니다.
export default function IngestBridge({ tenantId }: { tenantId: string }) {
  useIngestSync(tenantId); // ✅ 여기서 실시간 구독+무효화 일괄 처리
  return null;
}
