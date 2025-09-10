'use client';
import useSWR from 'swr';
import { getSupabaseBrowser } from './supabaseBrowser';
import { useDataVersion } from './versionStore';

const supa = getSupabaseBrowser();

export function useRpc<T>(name: string | null, args: Record<string, any> | null, keyParts: any[] = []) {
  const v = useDataVersion();
  const key = name ? ['rpc', name, v, ...keyParts, args ? JSON.stringify(args) : ''] : null;
  const { data, error, isLoading, mutate } = useSWR<T | null>(key, async (): Promise<T | null> => {
    if (!name) return null;
    const { data, error } = await supa.rpc(name, args ?? {});
    if (error) throw error;
    return data as T;
  }, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false,
    // 타임아웃은 재시도 금지
    shouldRetryOnError: (err: any) => err?.code !== '57014',
    // 최대 재시도 1회 (위 조건에서 제외된 에러만)
    errorRetryCount: 1,
    dedupingInterval: 30_000,
  });
  return { data, error, isLoading, mutate };
}
