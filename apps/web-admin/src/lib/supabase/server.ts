import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? "http://localhost";
const key = process.env.SUPABASE_SERVICE_ROLE ?? "dummy";

export const supaAdmin = createClient(url, key, { auth: { persistSession: false } });