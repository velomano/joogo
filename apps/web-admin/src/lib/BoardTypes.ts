export type DateISO = string;
export type MoneyKRW = number;

export interface DailyPoint {
  date: DateISO;
  sales: MoneyKRW;
  orders: number;
  roas: number;
}

export interface KPI {
  label: string;
  value: number;
  deltaPct?: number;
  help?: string;
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
  from: DateISO;
  to: DateISO;
  channels: string[];
  regions: string[];
  skus: string[];
  cuped: boolean;
  pinCompare: boolean;
}
