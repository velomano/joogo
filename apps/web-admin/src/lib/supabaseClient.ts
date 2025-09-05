// Supabase 클라이언트 싱글톤
import { createClient } from '@supabase/supabase-js';

const supaUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supaAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 싱글톤 클라이언트
let supabaseClient: any = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    supabaseClient = createClient(supaUrl, supaAnon);
  }
  return supabaseClient;
}
