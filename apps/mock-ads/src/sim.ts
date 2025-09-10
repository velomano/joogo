const MS = 60_000;

function xmur3(str: string) { let h = 1779033703 ^ str.length;
  for (let i=0;i<str.length;i++){h = Math.imul(h ^ str.charCodeAt(i),3432918353); h = h<<13|h>>>19;}
  return function(){h = Math.imul(h ^ (h>>>16),2246822507); h = Math.imul(h ^ (h>>>13),3266489909); h ^= h>>>16; return h>>>0;};
}
function mulberry32(a:number){return function(){let t=(a+=0x6d2b79f5); t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296;};}
function rngFor(seed: string){return mulberry32(xmur3(seed)());}

export type GenCfg = {
  seed: string; channels: string[]; lambdaPerHour: number;
  startMs: number; endMs: number; groupBy: "hour"|"day"; campaignId?: string; channel?: string;
};

export function genAdSeries(cfg: GenCfg){
  const out: {ts:string; channel:string; campaign_id:string; impressions:number; clicks:number; cost:number;}[] = [];
  const step = cfg.groupBy === "hour" ? 60*MS : 24*60*MS;
  for(let t = cfg.startMs; t <= cfg.endMs; t += step){
    for(const ch of cfg.channels){
      if (cfg.channel && cfg.channel !== ch) continue;
      const r = rngFor(`${cfg.seed}:${ch}:${t}:${cfg.campaignId??"CAMP-001"}`);
      // baseline by hour of day: daypart (higher 10-22h)
      const hod = new Date(t).getHours();
      const daypart = (hod>=10 && hod<=22) ? 1.3 : 0.7;
      // draw impressions ~ scaled lambda
      const impr = Math.max(0, Math.floor((cfg.lambdaPerHour * daypart) * (0.5 + r()*1.5)));
      const ctr = 0.01 + r()*0.03; // 1~4%
      const clicks = Math.floor(impr * ctr);
      const cpc = 50 + r()*250; // KRW 50~300
      const cost = Math.round(clicks * cpc);
      out.push({
        ts: new Date(t).toISOString(),
        channel: ch,
        campaign_id: cfg.campaignId ?? "CAMP-001",
        impressions: impr,
        clicks,
        cost
      });
    }
  }
  return out;
}
