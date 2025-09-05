'use client';
import { useSyncExternalStore } from 'react';

let v = 1;
const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function getSnapshot() { return v; }
export function bumpVersion() {
  v++;
  for (const cb of listeners) cb();
}

export function useDataVersion() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
