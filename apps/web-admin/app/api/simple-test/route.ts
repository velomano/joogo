import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Simple test API called');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Simple test API working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Simple test API error:', error);
    return NextResponse.json({ error: 'Simple test failed' }, { status: 500 });
  }
}
