import { NextResponse } from 'next/server';
export async function GET(req: Request) {
  const url = new URL(req.url);
  const to = new URL('/api/analytics/channel-region' + (url.search || ''), url.origin);
  return NextResponse.redirect(to, 307);
}

