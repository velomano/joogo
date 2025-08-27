import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ 
    error: 'This API is deprecated. Please use /api/upload/parse and /api/upload/ingest instead.',
    new_endpoints: {
      parse: '/api/upload/parse',
      ingest: '/api/upload/ingest'
    }
  }, { status: 410 });
}
