'use client';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
// matrix/treemap register by side-effect when imported in components
Chart.register(...registerables, ChartDataLabels);
export { Chart };
