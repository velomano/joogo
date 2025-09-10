import { createClient } from "@supabase/supabase-js";

function pickEnv(...names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v) return { name: n, value: v };
  }
  return { name: names[0], value: undefined as unknown as string };
}

function mask(v?: string) {
  if (!v) return "MISSING";
  if (v.startsWith("http")) return v.slice(0, 10) + "...";
  return v.slice(0, 6) + "...";
}

export function supaAdmin() {
  const urlPick = pickEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
  const keyPick = pickEnv("SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!urlPick.value) {
    throw new Error("ENV missing: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)");
  }
  if (!keyPick.value) {
    throw new Error("ENV missing: SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  }

  // 디버깅을 위해 임시로 활성화
  if (process.env.NODE_ENV !== "production") {
    console.log(`[supaAdmin] url=${mask(urlPick.value)} key=${keyPick.name}=${mask(keyPick.value)} runtime=node`);
  }

  return createClient(urlPick.value, keyPick.value, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
}
