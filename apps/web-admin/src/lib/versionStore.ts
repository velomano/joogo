'use client';
import { create } from 'zustand';

type VS = { v: number; inc: ()=>void };
export const useDataVersionStore = create<VS>((set) => ({
  v: 1,
  inc: () => set((s) => ({ v: s.v + 1 }))
}));
