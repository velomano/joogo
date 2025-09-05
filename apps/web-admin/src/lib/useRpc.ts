'use client';
import useSWR from 'swr';
import { useDataVersionStore } from './versionStore';
import { getSupabaseClient } from './supabaseClient';

export function useRpc<T>(
  name: string,
  args: Record<string, any> | null,
  keyParts: any[] = []
) {
  const v = useDataVersionStore((s)=>s.v);
  const key = [ 'rpc', name, v, ...keyParts, args ? JSON.stringify(args) : '' ];

  const { data, error, isLoading, mutate } = useSWR<T>(key, async () => {
    console.log(`🔄 RPC 호출: ${name}`, { args, version: v });
    
    const supa = getSupabaseClient();
    // 서버 캐시를 피하기 위해 REST 경유 대신 RPC로 바로; 브라우저 캐시도 없음
    const { data, error } = await supa.rpc(name, args ?? {});
    if (error) {
      console.error(`❌ RPC 오류: ${name}`, error);
      throw error;
    }
    
    console.log(`✅ RPC 성공: ${name}`, { dataLength: Array.isArray(data) ? data.length : 'not array' });
    return data as T;
  }, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: true,
    dedupingInterval: 5000
  });

  return { data, error, isLoading, mutate };
}
