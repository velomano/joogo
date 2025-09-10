export type SeriesPoint = { ts: string; value: number };
export function toK(n: number) { return Math.abs(n) >= 1000 ? `${(n/1000).toFixed(1)}k` : String(n); }
export function toWon(n: number) { return new Intl.NumberFormat("ko-KR").format(n); }
/** 필요한 곳에서 any로라도 쓸 수 있게 최소 형태만 제공 */
export function buildTimeSeries(rows: any[], xKey = "ts", yKey = "value"): SeriesPoint[] {
  return (rows ?? []).map((r: any) => ({ ts: String(r?.[xKey]), value: Number(r?.[yKey] ?? 0) }));
}
