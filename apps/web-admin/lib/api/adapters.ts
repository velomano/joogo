export type SalesParams = { from: string; to: string; g?: "day"|"week"|"month" };
const q = (p: Record<string,string>) => new URLSearchParams(p).toString();

export async function fetchSales(p: SalesParams) {
  const res = await fetch(`/api/sales?${q({ from: p.from, to: p.to, g: p.g ?? "day" })}`, { cache: "no-store" });
  if (!res.ok) throw new Error("fetchSales failed");
  return res.json();
}


