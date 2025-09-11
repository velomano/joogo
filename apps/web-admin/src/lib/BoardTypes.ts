export type DateISO = string;

export type ChannelKey = "naver" | "kakao" | "google" | "coupang" | "etc";

export interface ColorPalette {
  primary: string; 
  secondary: string; 
  accent: string; 
  danger: string; 
  warning: string;
  info: string; 
  success: string; 
  purple: string; 
  pink: string; 
  indigo: string; 
  teal: string;
  orange: string; 
  cyan: string; 
  lime: string; 
  amber: string; 
  emerald: string; 
  sky: string;
  slate: string; 
  zinc: string; 
  neutral: string; 
  stone: string;
}

export type XY = { x: number; y: number };

export interface KPI {
  label: string;
  value: number;
  deltaPct?: number;
  help?: string;
}

export interface DailyPoint {
  date: DateISO;
  sales: number;
  orders: number;
  roas: number;
}

export interface BreakdownRow {
  label: string;
  value: number;
  deltaPct?: number;
}

export interface BoardSnapshot {
  kpis: KPI[];
  daily: DailyPoint[];
  byChannel: BreakdownRow[];
  byRegion: BreakdownRow[];
  topSkus: BreakdownRow[];
  insights: string[];
}

export interface BoardDataSource {
  fetchSnapshot(params: {
    from: DateISO;
    to: DateISO;
    channels?: string[];
    regions?: string[];
    skus?: string[];
    cuped?: boolean;
    pinCompare?: boolean;
  }): Promise<BoardSnapshot>;
}

export interface BoardFilters {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  cuped?: boolean;
  pinCompare?: boolean;
}