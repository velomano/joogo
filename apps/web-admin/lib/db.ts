import { createClient } from "@supabase/supabase-js";

/** 서버 라우트용 클라이언트 (Service Role 또는 Anon — 빌드 통과 우선) */
export function supaServer() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    "http://localhost";
  const key =
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "anon";
  return createClient(url, key, { auth: { persistSession: false } });
}

/** 브라우저/클라이언트용 */
export function supaClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon";
  return createClient(url, key, { auth: { persistSession: false } });
}

/** 기존 코드가 기대하는 이름 대응 */
export function supa() { return supaServer(); }
export default supaServer;