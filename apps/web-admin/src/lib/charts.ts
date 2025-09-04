"use client";

import "chart.js/auto";
import type { Chart, ChartConfiguration } from "chart.js";

const registry = new Map<string, Chart>();

function getCanvas(id: string): HTMLCanvasElement | null {
  const el = typeof window !== "undefined" ? document.getElementById(id) : null;
  if (!el) return null;
  return (el as HTMLCanvasElement) ?? null;
}

export function ensureChart(id: string, config: ChartConfiguration): Chart | null {
  const canvas = getCanvas(id);
  if (!canvas) return null;
  // @ts-ignore
  const ChartCtor = (window as any).Chart as typeof import("chart.js").Chart;

  const existing = registry.get(id);
  if (!existing) {
    const chart = new ChartCtor(canvas.getContext("2d"), config);
    registry.set(id, chart);
    return chart;
  }

  // @ts-ignore
  if (existing.config.type !== config.type) {
    existing.destroy();
    const chart = new ChartCtor(canvas.getContext("2d"), config);
    registry.set(id, chart);
    return chart;
  }

  existing.data = config.data!;
  existing.options = config.options;
  existing.update("none");
  return existing;
}

export function destroyChart(id: string) {
  const c = registry.get(id);
  if (c) {
    c.destroy();
    registry.delete(id);
  }
}

export function destroyAllCharts() {
  Array.from(registry.keys()).forEach(destroyChart);
}

export function lineConfig(labels: string[], seriesLabel: string, values: number[]): ChartConfiguration {
  return {
    type: "line",
    data: {
      labels,
      datasets: [{ label: seriesLabel, data: values, tension: 0.2, pointRadius: 2 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { autoSkip: true, maxTicksLimit: 12 } },
        y: { beginAtZero: true }
      }
    }
  };
}

export function barConfig(labels: string[], seriesLabel: string, values: number[]): ChartConfiguration {
  return {
    type: "bar",
    data: {
      labels,
      datasets: [{ label: seriesLabel, data: values }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: { legend: { display: true } },
      scales: {
        x: { ticks: { autoSkip: true } },
        y: { beginAtZero: true }
      }
    }
  };
}
