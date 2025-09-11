'use client';
import { create } from 'zustand';

type FiltersState = {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  setRange: (from: string, to: string) => void;
  setFilter: (k: 'region' | 'channel' | 'category' | 'sku', v: string[]) => void;
};

export const useFilters = create<FiltersState>((set) => ({
  from: '2025-01-01',
  to: '2025-12-31',
  region: [],
  channel: [],
  category: [],
  sku: [],
  setRange: (from, to) => set({ from, to }),
  setFilter: (k, v) => set({ [k]: v } as any)
}));
