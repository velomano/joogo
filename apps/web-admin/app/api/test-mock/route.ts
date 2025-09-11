import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ 
    message: 'Mock API is working!',
    timestamp: new Date().toISOString()
  });
}
