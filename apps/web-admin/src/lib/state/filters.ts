export interface Filters {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  cuped?: boolean;
  pinCompare?: boolean;
}

export const useFilters = (): Filters => ({
  from: '2025-01-01',
  to: '2025-12-31',
  region: [],
  channel: [],
  category: [],
  sku: [],
  cuped: false,
  pinCompare: false
});