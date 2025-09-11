import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon";
export const supa = createClient(url, key, { auth: { persistSession: false } });
