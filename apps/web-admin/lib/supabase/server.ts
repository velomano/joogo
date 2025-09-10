import { supaServer } from "../db";
export function createServerClient() { return supaServer(); }
export function supa() { return supaServer(); }
export function supaAdmin() { return supaServer(); }
export default createServerClient;
