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
  async calendarHeatmap(range:DateRange,f:Filters){
    // DB에서 데이터 가져오기 (폴백: Mock API)
    try {
      console.log('📊 Fetching calendar data from DB...');
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'calendar'
      });
      const response = await fetch(`/api/data/sales?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data from DB');
      const data = await response.json();
      
      if (data.length === 0) {
        console.log('⚠️ No data in DB, falling back to mock API');
        return await this.calendarHeatmapMock(range, f);
      }
      
      console.log(`✅ Fetched ${data.length} records from DB`);
      
      // DB 데이터를 calendarHeatmap 형식으로 변환
      const calendarData = data.map((item: any) => ({
        date: item.date,
        revenue: item.revenue || 0,
        roas: item.roas || 2.0,
        is_event: false, // DB에는 이벤트 정보가 없으므로 기본값
        spend: item.spend || (item.revenue / (item.roas || 2.0)),
        quantity: item.quantity || 0,
        sku: item.sku || 'UNKNOWN'
      }));
      
      console.log('📊 Converted DB data for calendar:', calendarData.slice(0, 3));
      return calendarData;
    } catch (error) {
      console.error('Error fetching calendar data from DB:', error);
      console.log('🔄 Falling back to mock API...');
      return await this.calendarHeatmapMock(range, f);
    }
  },

  async calendarHeatmapMock(range:DateRange,f:Filters){
    // Mock API에서 데이터 가져오기 (폴백)
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'calendar'
      });
      const response = await fetch(`/api/mock/cafe24?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      // Fallback to basic data
      const start = new Date(range.from);
      const end = new Date(range.to);
      const days = Math.ceil((+end - +start) / 86400000) + 1;
      
      return Array.from({length: days}).map((_,i)=>{
        const d = new Date(+start + i * 86400000);
        const seasonal = 1 + (d.getMonth() === 5 || d.getMonth() === 10 ? 0.4 : 0);
        const event = d.getDate() === 1 || d.getDate() === 15 ? 1 : 0;
        const revenue = Math.round(500000 + 4500000 * seasonal * (0.7 + Math.random()));
        const roas = +(2.0 + (Math.random() - 0.5) * 0.6).toFixed(2);
        return {date: d.toISOString().slice(0,10), revenue, roas, is_event: !!event};
      });
    }
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
    const result: any[] = [];
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
  },

  async weatherData(range:DateRange, region:string = 'SEOUL'){
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        region: region
      });
      const response = await fetch(`/api/weather?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Fallback to mock data
      const start = new Date(range.from);
      const end = new Date(range.to);
      const days = Math.ceil((+end - +start) / 86400000) + 1;
      
      return Array.from({length: days}).map((_,i)=>{
        const d = new Date(+start + i * 86400000);
        const dayOfYear = Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
        const baseTemp = 15;
        const seasonal = 10 * Math.sin((dayOfYear - 80) * 2 * Math.PI / 365);
        const daily = 5 * Math.sin(dayOfYear * 0.1);
        const random = (Math.random() - 0.5) * 8;
        const tavg = Math.round((baseTemp + seasonal + daily + random) * 10) / 10;
        
        return {
          date: d.toISOString().slice(0,10),
          tavg,
          source: 'mock_fallback'
        };
      });
    }
  }
};
