import { NextRequest, NextResponse } from "next/server";
import { supaAdmin } from '@/lib/supabase/server';

async function csvParseSync(text: string) {
  const mod = await import("csv-parse/sync");
  return (mod as any).parse(text, { columns: true, skip_empty_lines: true, trim: true });
}
import { v4 as uuidv4 } from "uuid";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() { 
  return NextResponse.json({ ok: true, ping: "ingest alive" }); 
}

type Row = Record<string, any>;
const num = (v: any) => { const n = Number(String(v ?? "").replace(/[, ]/g, "")); return Number.isFinite(n) ? n : null; };
const str = (v: any) => { const s = String(v ?? "").trim(); return s.length ? s : null; };
const ymd = (v: any) => { const s = String(v ?? "").trim(); if (!s) return null; return s.replace(/\//g, "-").slice(0, 10) || null; };

export async function POST(req: NextRequest) {
  const tag = "[/api/board/ingest]";
  try {
    const form = await req.formData();
    const tenant_id = String(form.get("tenant_id") ?? "").trim(); // 공백 제거
    const file = form.get("file") as File | null;
    if (!tenant_id) return NextResponse.json({ ok: false, error: "tenant_id missing" }, { status: 400 });
    if (!file) return NextResponse.json({ ok: false, error: "file missing" }, { status: 400 });

    const ab = await file.arrayBuffer();
    const csvText = new TextDecoder("utf-8").decode(new Uint8Array(ab));
    const records: Row[] = await csvParseSync(csvText);

    const file_id = uuidv4();
    const rows = records.map((r, i) => ({
      row_num: i + 1,
      sale_date: ymd((r as any).sale_date ?? (r as any).date),
      region: str((r as any).region),
      channel: str((r as any).channel),
      category: str((r as any).category),
      sku: str((r as any).sku),
      qty: num((r as any).qty),
      revenue: num((r as any).revenue),
      ad_cost: num((r as any).ad_cost ?? (r as any).spend),
      discount_rate: num((r as any).discount_rate ?? (r as any).discount),
      tavg: num((r as any).tavg),
      original_data: r,
    }));

    const sb = supaAdmin();
    
    // 1) stage insert
    const ins = await sb.rpc("board_stage_insert_rows", {
      p_tenant_id: tenant_id,
      p_file_id: file_id,
      p_rows: rows as any,
    });
    if (ins.error) {
      console.error(tag, "stage insert error:", ins.error.message);
      throw ins.error;
    }
    
    // 2) merge
    const mg = await sb.rpc("board_merge_file", { p_tenant_id: tenant_id, p_file_id: file_id });
    if (mg.error) {
      console.error(tag, "merge error:", mg.error.message);
      throw mg.error;
    }

    return NextResponse.json({ ok: true, file_id, inserted: rows.length });
  } catch (e: any) {
    console.error(tag, "ERROR:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message ?? "ingest error" }, { status: 500 });
  }
}

