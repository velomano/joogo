import { env } from './env';

export const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
  'CDN-Cache-Control': 'public, s-maxage=60',
  'Vercel-CDN-Cache-Control': 'public, s-maxage=60',
} as const;

export const STATIC_CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
} as const;

export function getCacheHeaders(isStatic = false) {
  return isStatic ? STATIC_CACHE_HEADERS : CACHE_HEADERS;
}

// SWR 설정
export const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 5 * 60 * 1000, // 5분
  dedupingInterval: 2 * 1000, // 2초
} as const;
