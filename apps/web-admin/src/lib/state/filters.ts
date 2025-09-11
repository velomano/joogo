import { useState, useCallback } from 'react';

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

const getDateRange = (period: string) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  switch (period) {
    case 'today':
      return { from: todayStr, to: todayStr };
    case '1week':
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      return { from: weekAgo.toISOString().split('T')[0], to: todayStr };
    case '1month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(today.getMonth() - 1);
      return { from: monthAgo.toISOString().split('T')[0], to: todayStr };
    case '3months':
      const threeMonthsAgo = new Date(today);
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      return { from: threeMonthsAgo.toISOString().split('T')[0], to: todayStr };
    case '6months':
      const sixMonthsAgo = new Date(today);
      sixMonthsAgo.setMonth(today.getMonth() - 6);
      return { from: sixMonthsAgo.toISOString().split('T')[0], to: todayStr };
    default:
      return { from: '2025-01-01', to: '2025-12-31' };
  }
};

export const useFilters = () => {
  const [filters, setFilters] = useState<Filters>({
    from: '2025-01-01',
    to: '2025-12-31',
    region: [],
    channel: [],
    category: [],
    sku: [],
    cuped: false,
    pinCompare: false
  });

  const updateFilters = useCallback((updates: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const setDateRange = useCallback((from: string, to: string) => {
    setFilters(prev => ({ ...prev, from, to }));
  }, []);

  const setPeriod = useCallback((period: string) => {
    const { from, to } = getDateRange(period);
    console.log('setPeriod 호출:', { period, from, to }); // 디버깅용
    setFilters(prev => {
      console.log('이전 필터 상태:', prev); // 디버깅용
      const newFilters = { ...prev, from, to };
      console.log('새로운 필터 상태:', newFilters); // 디버깅용
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      from: '2025-01-01',
      to: '2025-12-31',
      region: [],
      channel: [],
      category: [],
      sku: [],
      cuped: false,
      pinCompare: false
    });
  }, []);

  return {
    ...filters,
    updateFilters,
    setDateRange,
    setPeriod,
    resetFilters
  };
};