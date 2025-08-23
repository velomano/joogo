import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });
export const runtime = 'nodejs';

// OpenAI 클라이언트 (필요시에만 사용)
// const openai = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// 타임아웃 설정 (5초로 단축)
const QUERY_TIMEOUT = 5000;

// 간단한 캐시 (메모리 기반)
const responseCache = new Map<string, any>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

// 캐시 키 생성
function generateCacheKey(tenantId: string, question: string): string {
  return `${tenantId}:${question}`;
}

// 캐시에서 응답 조회
function getFromCache(cacheKey: string): any | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

// 캐시에 응답 저장
function saveToCache(cacheKey: string, data: any): void {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}

export async function POST(req: Request) {
  const sessionId = `session_${Date.now()}`;

  try {
    const body = await req.json().catch(() => ({}));
    const { question, tenantId } = body;

    if (!question) return NextResponse.json({ error: 'question required' }, { status: 400 });
    if (!tenantId) return NextResponse.json({ error: 'tenant_id required' }, { status: 400 });

    // Safe SQL guard: SQL 인젝션 방지
    if (question.toLowerCase().includes('drop') || 
        question.toLowerCase().includes('delete') || 
        question.toLowerCase().includes('insert') || 
        question.toLowerCase().includes('update') ||
        question.toLowerCase().includes('create') ||
        question.toLowerCase().includes('alter')) {
      return NextResponse.json({ error: 'SQL injection detected' }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json({ error: 'Supabase configuration missing' }, { status: 500 });
    }

    const supabase = createClient(url, serviceKey, {
      db: { schema: 'public' },
      global: { headers: { 'X-Client-Info': 'joogo-ask-api' } }
    });

    // 타임아웃 설정
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), QUERY_TIMEOUT);

    try {
      // 1. 캐시 확인
      const cacheKey = generateCacheKey(tenantId, question);
      const cachedResponse = getFromCache(cacheKey);

      if (cachedResponse) {
        console.log('💰 캐시 히트!');
        return NextResponse.json({
          ...cachedResponse,
          meta: { fromCache: true, sessionId }
        });
      }

      // 2. 기본 응답 생성 (토큰 최적화 모듈 없이)
      const response = {
        intent: 'general_query',
        type: 'summary',
        summary: `질문 "${question}"에 대한 기본 응답입니다.`,
        data: [],
        analysis: {
          intent: 'general_query',
          confidence: 0.6,
          method: 'fallback'
        }
      };

      // 캐시에 저장
      saveToCache(cacheKey, response);

      return NextResponse.json({
        ...response,
        meta: { fromCache: false, sessionId }
      });

    } finally {
      clearTimeout(timeoutId);
      if (controller.signal.aborted) {
        return NextResponse.json({ error: 'Query timeout exceeded (5s)' }, { status: 408 });
      }
    }

  } catch (e: any) {
    console.error('API 에러:', e);
    return NextResponse.json({
      error: e?.message || 'Internal server error',
      meta: { sessionId }
    }, { status: 500 });
  }
}




