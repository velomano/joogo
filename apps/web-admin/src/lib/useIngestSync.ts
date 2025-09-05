'use client';
import { useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { strongClientReset } from './strongReset';
import { useRouter } from 'next/navigation';
import { useDataVersionStore } from './versionStore';

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function useIngestSync(tenantId: string, opts?: { charts?: Record<string, any> }) {
  const router = useRouter();
  const supa = createClient(supaUrl, supaAnon);
  const { inc } = useDataVersionStore();

  useEffect(() => {
    if (!tenantId) return;

    console.log('🔄 실시간 동기화 시작:', tenantId);

    // 1) ingest_jobs 실시간 구독 (merged 감지)
    const ch1 = supa
      .channel(`jobs:${tenantId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'analytics',
        table: 'ingest_jobs',
        filter: `tenant_id=eq.${tenantId}`
      }, async (payload) => {
        const row = payload.new || payload.old || {};
        console.log('📊 ingest_jobs 이벤트:', row);
        
        if (row.status === 'merged') {
          console.log('✅ 머지 완료 감지 - 전 페이지 무효화 시작');
          await invalidateAll();
        }
      })
      .subscribe();

    // 2) data_version도 구독해서 확실히 때리기
    const ch2 = supa
      .channel(`ver:${tenantId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'analytics',
        table: 'data_version',
        filter: `tenant_id=eq.${tenantId}`
      }, async (payload) => {
        console.log('📊 data_version 이벤트:', payload);
        await invalidateAll();
      })
      .subscribe();

    async function invalidateAll() {
      console.log('🔄 전 페이지 무효화 시작');
      
      // 전역 버전 증가 → SWR/ReactQuery 키가 바뀌어 재조회
      inc();
      
      // 차트/스토리지/캐시 비우고
      await strongClientReset({ 
        charts: opts?.charts,
        skipReload: true // router.refresh()로 처리
      });
      
      // RSC 라우트 재실행
      router.refresh();
      
      console.log('✅ 전 페이지 무효화 완료');
    }

    return () => {
      console.log('🔄 실시간 동기화 종료');
      supa.removeChannel(ch1);
      supa.removeChannel(ch2);
    };
  }, [tenantId]);
}
