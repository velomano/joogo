'use client';

import { useState, useCallback, useMemo } from 'react';

export interface FilterState {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  tenantId?: string;
}

export interface UseFiltersReturn {
  filters: FilterState;
  setFrom: (from: string) => void;
  setTo: (to: string) => void;
  setRegion: (region: string[]) => void;
  setChannel: (channel: string[]) => void;
  setCategory: (category: string[]) => void;
  setSku: (sku: string[]) => void;
  setTenantId: (tenantId: string) => void;
  resetFilters: () => void;
  updateFilters: (updates: Partial<FilterState>) => void;
  getQueryParams: () => URLSearchParams;
}

const defaultFilters: FilterState = {
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0],
  region: [],
  channel: [],
  category: [],
  sku: [],
};

export function useFilters(initialFilters?: Partial<FilterState>): UseFiltersReturn {
  const [filters, setFilters] = useState<FilterState>({
    ...defaultFilters,
    ...initialFilters,
  });

  const setFrom = useCallback((from: string) => {
    setFilters(prev => ({ ...prev, from }));
  }, []);

  const setTo = useCallback((to: string) => {
    setFilters(prev => ({ ...prev, to }));
  }, []);

  const setRegion = useCallback((region: string[]) => {
    setFilters(prev => ({ ...prev, region }));
  }, []);

  const setChannel = useCallback((channel: string[]) => {
    setFilters(prev => ({ ...prev, channel }));
  }, []);

  const setCategory = useCallback((category: string[]) => {
    setFilters(prev => ({ ...prev, category }));
  }, []);

  const setSku = useCallback((sku: string[]) => {
    setFilters(prev => ({ ...prev, sku }));
  }, []);

  const setTenantId = useCallback((tenantId: string) => {
    setFilters(prev => ({ ...prev, tenantId }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.region.length > 0) params.set('region', filters.region.join(','));
    if (filters.channel.length > 0) params.set('channel', filters.channel.join(','));
    if (filters.category.length > 0) params.set('category', filters.category.join(','));
    if (filters.sku.length > 0) params.set('sku', filters.sku.join(','));
    if (filters.tenantId) params.set('tenant_id', filters.tenantId);
    
    return params;
  }, [filters]);

  return {
    filters,
    setFrom,
    setTo,
    setRegion,
    setChannel,
    setCategory,
    setSku,
    setTenantId,
    resetFilters,
    updateFilters,
    getQueryParams,
  };
}
