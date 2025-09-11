import { NextResponse } from 'next/server';
export async function GET(req:Request){const {searchParams}=new URL(req.url); const kind=searchParams.get('kind')??'funnel';
  if(kind==='funnel'){const marketing=[{stage:'impr',value:100000,group:'marketing' as const},{stage:'clicks',value:9000,group:'marketing' as const}];
    const merchant=[{stage:'impr',value:60000,group:'merchant' as const},{stage:'clicks',value:5400,group:'merchant' as const},{stage:'orders',value:360,group:'merchant' as const}];
    return NextResponse.json([...marketing,...merchant]);} return NextResponse.json({ok:true});}
