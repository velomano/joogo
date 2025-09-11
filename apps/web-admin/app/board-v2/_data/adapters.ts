export type DateRange={from:string;to:string};
export type Filters={channel?:string[];region?:string[];category?:string[];sku?:string[]};

// 실제 API에서 데이터를 가져오는 함수들
async function fetchRegions(): Promise<string[]> {
  try {
    const response = await fetch('/api/analytics/regions');
    if (!response.ok) throw new Error('Failed to fetch regions');
    return await response.json();
  } catch (error) {
    console.error('Error fetching regions:', error);
    return ['SEOUL', 'BUSAN']; // fallback
  }
}

async function fetchChannels(): Promise<string[]> {
  try {
    const response = await fetch('/api/analytics/channels');
    if (!response.ok) throw new Error('Failed to fetch channels');
    return await response.json();
  } catch (error) {
    console.error('Error fetching channels:', error);
    return ['web', 'app']; // fallback
  }
}

export const Adapters={
  calendarHeatmap(range:DateRange,f:Filters){
    // 더미 데이터 생성
    const start = new Date(range.from);
    const end = new Date(range.to);
    const days = Math.ceil((+end - +start) / 86400000) + 1;
    
    return Promise.resolve(Array.from({length: days}).map((_,i)=>{
      const d = new Date(+start + i * 86400000);
      const seasonal = 1 + (d.getMonth() === 5 || d.getMonth() === 10 ? 0.4 : 0);
      const event = d.getDate() === 1 || d.getDate() === 15 ? 1 : 0;
      const revenue = Math.round(500000 + 4500000 * seasonal * (0.7 + Math.random()));
      const roas = +(2.0 + (Math.random() - 0.5) * 0.6).toFixed(2);
      return {date: d.toISOString().slice(0,10), revenue, roas, is_event: !!event};
    }));
  },
  
  async channelRegion(range:DateRange,f:Filters){
    // Mock API에서 풍부한 데이터 가져오기
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'channel_region'
      });
      const response = await fetch(`/api/mock/cafe24?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch channel region data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching channel region data:', error);
      // Fallback to basic data
      const channels = ['web', 'app'];
      const regions = ['SEOUL', 'BUSAN'];
      const start = new Date(range.from);
      const end = new Date(range.to);
      const days = Math.ceil((+end - +start) / 86400000) + 1;
      
      const result: {date: string; channel: string; region: string; revenue: number; roas: number}[] = [];
      for(let i = 0; i < days; i++){
        const d = new Date(+start + i * 86400000);
        for(const c of channels){
          for(const r of regions){
            const revenue = Math.round(200000 + 1600000 * (0.8 + Math.random()));
            const roas = +(1.6 + (Math.random() - 0.5) * 0.6).toFixed(2);
            result.push({date: d.toISOString().slice(0,10), channel: c, region: r, revenue, roas});
          }
        }
      }
      return result;
    }
  },
  
  treemapPareto(range:DateRange,f:Filters){
    const cats = ['TOPS', 'BOTTOMS', 'OUTER', 'ACC'];
    const result = [];
    for(const cat of cats){
      for(let i = 0; i < 10; i++){
        const sku = `${cat}-${String(i+1).padStart(3,'0')}`;
        const revenue = Math.round(3_000_000 * (0.4 + Math.random() * (cat === 'TOPS' ? 1.4 : 1)));
        const roas = +(1.5 + Math.random()).toFixed(2);
        result.push({category: cat, sku, revenue, roas});
      }
    }
    return Promise.resolve(result);
  },
  
  async funnel(range:DateRange,f:Filters){
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'funnel'
      });
      const response = await fetch(`/api/mock/weather-ads?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch funnel data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      // Fallback to basic data
      const marketing = [
        {stage: 'impr', value: 100000, group: 'marketing' as const},
        {stage: 'clicks', value: 9000, group: 'marketing' as const}
      ];
      const merchant = [
        {stage: 'impr', value: 60000, group: 'merchant' as const},
        {stage: 'clicks', value: 5400, group: 'merchant' as const},
        {stage: 'orders', value: 360, group: 'merchant' as const}
      ];
      return [...marketing, ...merchant];
    }
  }
};
