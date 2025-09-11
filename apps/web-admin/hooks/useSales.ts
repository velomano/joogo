"use client";

import useSWR from "swr";
import { useFilters } from "@/hooks/useFilters";

const fetcher = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed: ${res.status}`);
  return res.json();
};

const qs = (p: Record<string,string>) =>
  Object.entries(p).map(([k,v]) => `${k}=${encodeURIComponent(v)}`).join("&");

export function useSales() {
  const { from, to, granularity } = useFilters();
  const key = `/api/sales?${qs({ from, to, g: granularity })}`;
  const { data, error, isValidating } = useSWR(key, fetcher, { keepPreviousData: true });
  return { data, error, isLoading: !data && !error, isValidating };
}


