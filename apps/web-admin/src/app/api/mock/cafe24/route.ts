import { NextResponse } from 'next/server';
function seedRand(seed:number){let s=seed;return()=> (s=(s*1664525+1013904223)%4294967296)/4294967296;}
export async function GET(req:Request){const {searchParams}=new URL(req.url);
  const from=searchParams.get('from')??'2025-01-01'; const to=searchParams.get('to')??'2025-12-31'; const kind=searchParams.get('kind')??'calendar';
  const start=new Date(from), end=new Date(to); const days=Math.ceil((+end-+start)/86400000)+1; const rng=seedRand(42);
  if(kind==='calendar'){const arr=Array.from({length:days}).map((_,i)=>{const d=new Date(+start+i*86400000);
    const mm=d.getMonth(); const seasonal=1+((mm===5||mm===10)?0.4:0)+((mm>=6&&mm<=8)?0.2:0); const event=(d.getDate()===1||d.getDate()===15)?1:0;
    const rev=Math.round(500000+4500000*seasonal*(0.7+rng())); const roas=+(2.0+(rng()-0.5)*0.6).toFixed(2);
    return {date:d.toISOString().slice(0,10),revenue:rev,roas,is_event:!!event};}); return NextResponse.json(arr);}
  if(kind==='channel_region'){const channels=['web','app'], regions=['SEOUL','BUSAN']; const out:any[]=[];
    for(let i=0;i<days;i++){const d=new Date(+start+i*86400000);
      for(const c of channels) for(const r of regions){const rev=Math.round(200000+1600000*(0.8+rng())); const roas=+(1.6+(rng()-0.5)*0.6).toFixed(2);
        out.push({date:d.toISOString().slice(0,10),channel:c,region:r,revenue:rev,roas});}} return NextResponse.json(out);}
  if(kind==='treemap'){const cats=['TOPS','BOTTOMS','OUTER','ACC']; const out:any[]=[];
    for(const cat of cats){for(let i=0;i<10;i++){const sku=`${cat}-${String(i+1).padStart(3,'0')}`; const rev=Math.round(3_000_000*(0.4+rng()*(cat==='TOPS'?1.4:1)));
      const roas=+(1.5+rng()).toFixed(2); out.push({category:cat,sku,revenue:rev,roas});}} return NextResponse.json(out);}
  return NextResponse.json({ok:true});}
