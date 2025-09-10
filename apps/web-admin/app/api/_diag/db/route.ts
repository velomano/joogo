export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  try {
    const cs = process.env.DATABASE_URL;
    if (!cs) return NextResponse.json({ ok: false, error: "DATABASE_URL missing" }, { status: 400 });

    const client = new (Client as any)({
      connectionString: cs.includes("sslmode=") ? cs : cs + (cs.includes("?") ? "&" : "?") + "sslmode=require",
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const r = await client.query("select current_user, now()");
    await client.end();
    return NextResponse.json({ ok: true, whoami: r.rows?.[0] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "db error" }, { status: 500 });
  }
}
