export type SeriesPoint = { ts: string; value: number };
export const toK = (n: number) => (Math.abs(n) >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n));
export const toWon = (n: number) => new Intl.NumberFormat("ko-KR").format(n);
export function buildTimeSeries(rows: any[], xKey = "ts", yKey = "value"): SeriesPoint[] {
  return (rows ?? []).map((r: any) => ({ ts: String(r?.[xKey]), value: Number(r?.[yKey] ?? 0) }));
}
