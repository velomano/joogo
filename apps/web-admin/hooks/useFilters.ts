"use client";

import { create } from "zustand";

export type Granularity = "day" | "week" | "month";
export type FilterState = {
  from: string; // ISO (yyyy-mm-dd)
  to: string;   // ISO
  granularity: Granularity;
};

type FilterActions = {
  setRange: (p: Partial<Pick<FilterState, "from" | "to">>) => void;
  setGranularity: (g: Granularity) => void;
  preset: {
    lastNDays: (n: number) => void;
    thisMonth: () => void;
    lastMonth: () => void;
    ytd: () => void;
  };
};

const todayISO = () => new Date().toISOString().slice(0, 10);
const addDaysISO = (iso: string, d: number) => {
  const dt = new Date(iso); dt.setDate(dt.getDate() + d);
  return dt.toISOString().slice(0, 10);
};

export const useFilters = create<FilterState & FilterActions>((set, get) => {
  const t = todayISO();
  return {
    from: addDaysISO(t, -30),
    to: t,
    granularity: "day",
    setRange: (p) => set((s) => ({ ...s, ...p })),
    setGranularity: (g) => set({ granularity: g }),
    preset: {
      lastNDays: (n) => {
        const to = todayISO();
        const from = addDaysISO(to, -n + 1);
        set({ from, to });
      },
      thisMonth: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
        const to = todayISO();
        set({ from, to });
      },
      lastMonth: () => {
        const now = new Date();
        const first = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const last  = new Date(now.getFullYear(), now.getMonth(), 0);
        set({ from: first.toISOString().slice(0,10), to: last.toISOString().slice(0,10) });
      },
      ytd: () => {
        const now = new Date();
        const from = new Date(now.getFullYear(), 0, 1).toISOString().slice(0,10);
        set({ from, to: todayISO() });
      },
    },
  };
});


