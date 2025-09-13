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
    return [];
  }
}

async function fetchChannels(): Promise<string[]> {
  try {
    const response = await fetch('/api/analytics/channels');
    if (!response.ok) throw new Error('Failed to fetch channels');
    return await response.json();
  } catch (error) {
    console.error('Error fetching channels:', error);
    return [];
  }
}

export const Adapters={
  // 광고비 데이터 가져오기
  async ads(range: DateRange, f: Filters) {
    try {
      const params = new URLSearchParams({
        from: range.from,
        to: range.to,
        ...(f.channel && f.channel.length > 0 && { channel: f.channel.join(',') })
      });
      
      const response = await fetch(`/api/ads?${params}`);
      if (!response.ok) throw new Error('Failed to fetch ads data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching ads data:', error);
      return [];
    }
  },

  async calendarHeatmap(range:DateRange,f:Filters){
    // Mock API에서 데이터 가져오기
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'calendar'
      });
      
      // 필터 값들을 쿼리 파라미터에 추가
      if (f.region && f.region.length > 0) {
        qs.append('region', f.region.join(','));
      }
      if (f.channel && f.channel.length > 0) {
        qs.append('channel', f.channel.join(','));
      }
      if (f.category && f.category.length > 0) {
        qs.append('category', f.category.join(','));
      }
      if (f.sku && f.sku.length > 0) {
        qs.append('sku', f.sku.join(','));
      }
      
      console.log('API 호출:', `/api/mock/cafe24?${qs}`); // 디버깅용
      const response = await fetch(`/api/mock/cafe24?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch calendar data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      return [];
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
      
      // 필터 값들을 쿼리 파라미터에 추가
      if (f.region && f.region.length > 0) {
        qs.append('region', f.region.join(','));
      }
      if (f.channel && f.channel.length > 0) {
        qs.append('channel', f.channel.join(','));
      }
      if (f.category && f.category.length > 0) {
        qs.append('category', f.category.join(','));
      }
      if (f.sku && f.sku.length > 0) {
        qs.append('sku', f.sku.join(','));
      }
      
      console.log('API 호출:', `/api/mock/cafe24?${qs}`); // 디버깅용
      const response = await fetch(`/api/mock/cafe24?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch channel region data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching channel region data:', error);
      return [];
    }
  },
  
  async treemapPareto(range:DateRange,f:Filters){
    // Mock API에서 데이터 가져오기
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        kind: 'treemap_pareto'
      });
      
      // 필터 값들을 쿼리 파라미터에 추가
      if (f.region && f.region.length > 0) {
        qs.append('region', f.region.join(','));
      }
      if (f.channel && f.channel.length > 0) {
        qs.append('channel', f.channel.join(','));
      }
      if (f.category && f.category.length > 0) {
        qs.append('category', f.category.join(','));
      }
      if (f.sku && f.sku.length > 0) {
        qs.append('sku', f.sku.join(','));
      }
      
      console.log('API 호출:', `/api/mock/cafe24?${qs}`); // 디버깅용
      const response = await fetch(`/api/mock/cafe24?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch treemap pareto data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching treemap pareto data:', error);
      return [];
    }
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
      return [];
    }
  },

  async weather(range:DateRange, f:Filters){
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        ...(f.region && f.region.length > 0 && { region: f.region.join(',') })
      });
      const response = await fetch(`/api/data/weather?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return [];
    }
  },

  async weatherData(range:DateRange, region:string = 'SEOUL'){
    try {
      const qs = new URLSearchParams({
        from: range.from,
        to: range.to,
        region: region
      });
      const response = await fetch(`/api/data/weather?${qs}`);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      return await response.json();
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return [];
    }
  }
};
