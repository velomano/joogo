export type DateRange={from:string;to:string}; export type Filters={channel?:string[];region?:string[];category?:string[];sku?:string[]};
const base=typeof window==='undefined'?(process.env.NEXT_PUBLIC_BASE_URL||''):'';
const isMock=process.env.NEXT_PUBLIC_USE_MOCK==='1';
async function get<T>(u:string){const r=await fetch(u,{cache:'no-store'});if(!r.ok) throw new Error('Fetch '+r.status); return r.json() as Promise<T>;}
export const Adapters={
  calendarHeatmap(range:DateRange,f:Filters){const qs=new URLSearchParams({from:range.from,to:range.to});
    const path=isMock?`/api/mock/cafe24?${qs}&kind=calendar`:`/api/analytics/calendar?${qs}`; return get<{date:string;revenue:number;roas?:number;is_event?:boolean}[]>(base+path);},
  channelRegion(range:DateRange,f:Filters){const qs=new URLSearchParams({from:range.from,to:range.to});
    const path=isMock?`/api/mock/cafe24?${qs}&kind=channel_region`:`/api/analytics/channel-region?${qs}`; return get<{date:string;channel:string;region:string;revenue:number;roas?:number}[]>(base+path);},
  treemapPareto(range:DateRange,f:Filters){const qs=new URLSearchParams({from:range.from,to:range.to});
    const path=isMock?`/api/mock/cafe24?${qs}&kind=treemap`:`/api/analytics/treemap?${qs}`; return get<{category:string;sku:string;revenue:number;roas?:number}[]>(base+path);},
  funnel(range:DateRange,f:Filters){const qs=new URLSearchParams({from:range.from,to:range.to});
    const path=isMock?`/api/mock/weather-ads?${qs}&kind=funnel`:`/api/analytics/funnel?${qs}`; return get<{stage:string;value:number;group:'marketing'|'merchant'}[]>(base+path);}
};
