import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // 키 없으면 빌드는 통과시키고, 호출만 503로 막기
    return NextResponse.json(
      { ok: false, error: 'OPENAI_API_KEY is not set' },
      { status: 503 }
    );
  }

  const client = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  // TODO: 기존 로직
  return NextResponse.json({ ok: true });
}




