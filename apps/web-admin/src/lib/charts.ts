import { Chart, ChartConfiguration } from "chart.js/auto";

const registry = new Map<string, Chart>();

export function ensureChart(id: string, cfg: ChartConfiguration) {
  const el = document.getElementById(id) as HTMLCanvasElement | null;
  if (!el) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;
  const existing = registry.get(id);
  if (existing) existing.destroy();
  const c = new Chart(ctx, cfg);
  registry.set(id, c);
}

export function lineConfig(labels: string[], label: string, values: number[]): ChartConfiguration<"line"> {
  return {
    type: "line",
    data: { labels, datasets: [{ label, data: values, pointRadius: 0, tension: 0.25 }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true } } }
  };
}

export function barConfig(labels: string[], label: string, values: number[]): ChartConfiguration<"bar"> {
  return {
    type: "bar",
    data: { labels, datasets: [{ label, data: values }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { beginAtZero: true } } }
  };
}

export function doughnutConfig(labels: string[], values: number[]): ChartConfiguration<"doughnut"> {
  return {
    type: "doughnut",
    data: { labels, datasets: [{ data: values }] },
    options: { responsive: true, maintainAspectRatio: false, animation: false, plugins: { legend: { display: true } } }
  };
}

export function scatterConfig(
  points: { x: number; y: number }[],
  pointLabel: string,
  xTitle = "X",
  yTitle = "Y"
): ChartConfiguration<"scatter"> {
  return {
    type: "scatter",
    data: { datasets: [{ label: pointLabel, data: points, pointRadius: 3 }] },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: true } },
      scales: { x: { title: { display: true, text: xTitle } }, y: { title: { display: true, text: yTitle }, beginAtZero: true } }
    }
  };
}

export function scatterWithTrendConfig(
  points: { x: number; y: number }[],
  trendPoints: { x: number; y: number }[],
  pointLabel: string,
  trendLabel: string,
  xTitle: string,
  yTitle: string
): ChartConfiguration<"scatter"> {
  return {
    type: "scatter",
    data: {
      datasets: [
        { label: pointLabel, data: points, pointRadius: 2 },
        { label: trendLabel, data: trendPoints, pointRadius: 0, showLine: true, borderWidth: 2 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false, animation: false,
      plugins: { legend: { display: true } },
      scales: { x: { title: { display: true, text: xTitle } }, y: { title: { display: true, text: yTitle }, beginAtZero: true } }
    }
  };
}