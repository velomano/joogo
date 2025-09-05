'use client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/** 싱글톤 브라우저 클라이언트 (모든 곳에서 이걸 import) */
export function getSupabaseBrowser(): SupabaseClient {
  if (client) return client;
  const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  client = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'sb-joogo', // 프로젝트 고유 키 (중복 경고 방지)
    },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}
