import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// 예: path = ingest/{tenant_id}/{YYYYMMDD}/sales-2025-08-23.xlsx
export async function uploadAndRegister(file: File, tenant_id: string, path: string) {
  const { data: put, error: e1 } = await supabase.storage.from("ingest").upload(path, file, {
    upsert: true, cacheControl: "3600"
  });
  if (e1) throw e1;
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/register-upload`, {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`, 
      "Content-Type": "application/json" 
    },
    body: JSON.stringify({ path, tenant_id, bytes: file.size })
  });
  
  if (!res.ok) throw new Error(await res.text());
  return await res.json(); // { ok, file_id }
}


