'use client';
import { useEffect, useRef } from 'react';
import { getSupabaseBrowser } from './supabaseBrowser';
import { strongClientReset } from './strongReset';
import { useRouter } from 'next/navigation';
import { bumpVersion } from './versionStore';

const chMap: Record<string, boolean> = {}; // tenant별 중복 구독 방지

export function useIngestSync(tenantId: string, opts?: { charts?: Record<string, any> }) {
  const router = useRouter();
  const supa = getSupabaseBrowser();
  const onceRef = useRef(false);

  useEffect(() => {
    if (!tenantId) return;
    if (chMap[tenantId]) return; // 이미 구독 중
    chMap[tenantId] = true;

    console.log('🔄 실시간 동기화 시작:', tenantId);

    const jobs = supa.channel(`jobs:${tenantId}`)
      .on('postgres_changes', {
        event: '*', schema: 'analytics', table: 'ingest_jobs',
        filter: `tenant_id=eq.${tenantId}`
      }, async (payload) => {
        const row: any = payload.new || payload.old || {};
        console.log('📊 ingest_jobs 이벤트:', row);
        if (row.status === 'merged') await invalidateAll();
      }).subscribe();

    const ver = supa.channel(`ver:${tenantId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'analytics', table: 'data_version',
        filter: `tenant_id=eq.${tenantId}`
      }, async () => { 
        console.log('📊 data_version 이벤트');
        await invalidateAll(); 
      }).subscribe();

    async function invalidateAll() {
      console.log('🔄 전 페이지 무효화 시작');
      
      // 전역 버전 증가 → 모든 SWR 키 재계산
      bumpVersion();
      
      // 차트/스토리지/캐시 정리
      await strongClientReset({ charts: opts?.charts });
      
      // RSC 재실행
      router.refresh();
      
      console.log('✅ 전 페이지 무효화 완료');
    }

    return () => {
      console.log('🔄 실시간 동기화 종료');
      supa.removeChannel(jobs);
      supa.removeChannel(ver);
      delete chMap[tenantId];
    };
  }, [tenantId]);
}
