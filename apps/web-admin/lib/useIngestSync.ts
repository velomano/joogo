'use client';
import { useEffect, useRef } from 'react';
import { getSupabaseBrowser } from './supabaseBrowser';
import { bumpVersion } from './versionStore';
// strongClientReset import 제거 - API 호출로 대체
import { useRouter } from 'next/navigation';

let channels: { jobs?: any; ver?: any } = {};

export function useIngestSync(tenantId: string) {
  const supa = getSupabaseBrowser();
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!tenantId || startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    (async () => {
      // ✅ 세션 대기 (로그인되어 있으면 access_token 부착됨)
      const { data: { session } } = await supa.auth.getSession();

      // DEV 폴백: 세션이 없고 환경이 개발이면 그냥 진행 (RLS는 폴백 정책으로 허용)
      if (!session && process.env.NEXT_PUBLIC_DEV_REALTIME_FALLBACK !== 'true') {
        console.warn('[ingest] no auth session; realtime subscribe skipped');
        return;
      }
      if (cancelled) return;

      console.log('[ingest] Starting subscription for tenant:', tenantId);

      channels.jobs = supa.channel(`jobs:${tenantId}`)
        .on('postgres_changes', {
          event: '*', schema: 'analytics', table: 'ingest_jobs', filter: `tenant_id=eq.${tenantId}`
        }, async (payload) => {
          const row: any = payload.new || payload.old || {};
          console.log('📊 ingest_jobs 이벤트:', row);
          if (row.status === 'merged') {
            console.log('[ingest] merged received → invalidate');
            bumpVersion();
            // API 호출로 리셋 (필요시)
            try {
              await fetch('/api/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tenantId, hard: true }),
              });
            } catch (error) {
              console.warn('[ingest] reset failed:', error);
            }
            router.refresh();
          }
        }).subscribe();

      channels.ver = supa.channel(`ver:${tenantId}`)
        .on('postgres_changes', {
          event: 'UPDATE', schema: 'analytics', table: 'data_version', filter: `tenant_id=eq.${tenantId}`
        }, async (payload) => {
          console.log('[ingest] data_version 이벤트:', payload);
          bumpVersion();
          // API 호출로 리셋 (필요시)
          try {
            await fetch('/api/reset', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId, hard: true }),
            });
          } catch (error) {
            console.warn('[ingest] reset failed:', error);
          }
          router.refresh();
        }).subscribe();
    })();

    const off = () => {
      if (channels.jobs) supa.removeChannel(channels.jobs);
      if (channels.ver) supa.removeChannel(channels.ver);
      channels = {};
      startedRef.current = false;
    };
    // StrictMode 대응: 언마운트 즉시 해제하지 않고 페이지 종료 시 해제
    window.addEventListener('pagehide', off);
    window.addEventListener('beforeunload', off);
    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', off);
      window.removeEventListener('beforeunload', off);
    };
  }, [tenantId]);
}
