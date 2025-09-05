'use client';
import useSWR from 'swr';
import { getSupabaseBrowser } from './supabaseBrowser';
import { useDataVersion } from './versionStore';

const supa = getSupabaseBrowser();

export function useRpc<T>(name: string, args: Record<string, any> | null, keyParts: any[] = []) {
  const v = useDataVersion();
  const key = ['rpc', name, v, ...keyParts, args ? JSON.stringify(args) : ''];
  const { data, error, isLoading, mutate } = useSWR<T>(key, async () => {
    const { data, error } = await supa.rpc(name, args ?? {});
    if (error) throw error;
    return data as T;
  }, { revalidateOnFocus: false, revalidateOnReconnect: true });
  return { data, error, isLoading, mutate };
}
