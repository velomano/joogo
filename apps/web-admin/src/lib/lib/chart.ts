import { Chart as ChartJS, ChartConfiguration } from "chart.js/auto";

export { ChartJS as Chart };

const registry = new Map<string, ChartJS>();

export function ensureChart(id: string, cfg: ChartConfiguration) {
  const el = document.getElementById(id) as HTMLCanvasElement | null;
  if (!el) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;
  const existing = registry.get(id);
  if (existing) existing.destroy();
  const c = new ChartJS(ctx, cfg);
  registry.set(id, c);
}

export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  plugins: {
    legend: {
      display: true,
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        font: { size: 10 }
      }
    }
  }
};

export const colorPalette = {
  primary: '#5aa2ff',
  secondary: '#2aa775', 
  accent: '#ff6b6b',
  danger: '#ff4757',
  warning: '#ffa502',
  info: '#3742fa',
  success: '#2ed573',
  purple: '#9c88ff',
  pink: '#ff9ff3',
  indigo: '#4834d4',
  teal: '#00d2d3',
  orange: '#ff9f43',
  cyan: '#0abde3',
  lime: '#a4b0be',
  amber: '#ffd32a',
  emerald: '#1dd1a1',
  sky: '#74b9ff',
  slate: '#57606f',
  zinc: '#747d8c',
  neutral: '#a4b0be',
  stone: '#ddd6fe'
};
