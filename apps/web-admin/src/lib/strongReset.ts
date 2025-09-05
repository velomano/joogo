// 강력한 클라이언트 리셋 유틸리티
// SWR or React Query 모두 대응, 없으면 자동 건너뜀

export interface StrongResetOptions {
  charts?: Record<string, any>;
  aborters?: AbortController[];
  skipReload?: boolean;
}

export async function strongClientReset(opts: StrongResetOptions = {}) {
  console.log('🔄 강력한 클라이언트 리셋 시작');
  
  try {
    // 1) in-flight 요청 중단
    if (opts.aborters) {
      opts.aborters.forEach(a => { 
        try { 
          a.abort(); 
          console.log('🛑 요청 중단됨');
        } catch {} 
      });
    }

    // 2) 차트 인스턴스 파괴
    if (opts.charts) {
      Object.values(opts.charts).forEach(c => {
        try {
          c?.destroy?.();
          console.log('📊 차트 인스턴스 파괴됨');
        } catch {}
      });
    }

    // 3) 메모리 상태 초기화(전역 store 사용 시)
    try {
      // 예: Zustand/Redux 초기화 훅 호출
      (globalThis as any).__BOARD_STORE__?.reset?.();
      console.log('🏪 전역 스토어 초기화됨');
    } catch {}

    // 4) 브라우저 저장소 초기화
    try {
      const keysToRemove = [
        'board:filters', 
        'board:lastFileId', 
        'ask:lastQuery',
        'tenant:current',
        'chart:cache'
      ];
      
      keysToRemove.forEach(k => {
        try {
          localStorage.removeItem(k);
          console.log(`🗑️ localStorage 키 삭제: ${k}`);
        } catch {}
      });
      
      // sessionStorage 완전 초기화
      try {
        sessionStorage.clear?.();
        console.log('🗑️ sessionStorage 초기화됨');
      } catch {}
      
      // 필요 시 IndexedDB/CacheStorage도 삭제
      if ('caches' in window) {
        try {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
          console.log(`🗑️ CacheStorage 초기화됨: ${keys.length}개 키`);
        } catch {}
      }
    } catch (e) {
      console.warn('저장소 초기화 중 오류:', e);
    }

    // 5) 데이터 fetching 레이어 캐시 초기화
    try { 
      // SWR
      const { mutate } = await import('swr');
      // 모든 키에 대해 undefined로 초기화
      // @ts-ignore
      mutate(() => true, undefined, { revalidate: false });
      console.log('🔄 SWR 캐시 초기화됨');
    } catch {}
    
    try { 
      // React Query
      const { queryClient } = (globalThis as any);
      queryClient?.clear?.();
      console.log('🔄 React Query 캐시 초기화됨');
    } catch {}

    // 6) 라우팅 리프레시 + 캐시 버스터
    if (!opts.skipReload) {
      const ts = Date.now();
      const url = new URL(location.href);
      url.searchParams.set('ts', String(ts));
      url.searchParams.set('reset', '1');
      
      console.log('🔄 페이지 리로드 시작');
      location.replace(url.toString());
    }

    console.log('✅ 강력한 클라이언트 리셋 완료');
    
  } catch (e) {
    console.error('❌ 강력한 클라이언트 리셋 중 오류:', e);
    // 오류가 있어도 페이지 리로드는 시도
    if (!opts.skipReload) {
      location.reload();
    }
  }
}

// 리셋 버튼용 헬퍼 함수
export async function handleReset(
  scope: 'tenant' | 'file', 
  tenantId: string, 
  fileId?: string,
  options: StrongResetOptions = {}
) {
  const aborter = new AbortController();
  
  try {
    console.log(`🔄 리셋 시작: ${scope} ${tenantId} ${fileId || ''}`);
    
    const r = await fetch('/api/board/reset', {
      method: 'POST',
      body: JSON.stringify({ tenant_id: tenantId }),
      headers: { 
        'content-type': 'application/json', 
        'cache-control': 'no-store' 
      },
      signal: aborter.signal
    });
    
    if (!r.ok) {
      const errorData = await r.json().catch(() => ({}));
      throw new Error(`RESET_HTTP_${r.status}: ${errorData.error || r.statusText}`);
    }
    
    const result = await r.json();
    console.log('✅ 리셋 API 성공:', result);
    
    // 강력한 클라이언트 리셋 실행
    await strongClientReset({ 
      ...options, 
      aborters: [aborter, ...(options.aborters || [])] 
    });
    
  } catch (e) {
    console.error('❌ 리셋 실패:', e);
    alert('리셋 실패: ' + (e as any)?.message);
  }
}
