'use client';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-chart-matrix';    // 전역 등록(사이드이펙트)
import 'chartjs-chart-treemap';   // 전역 등록(사이드이펙트)

Chart.register(...registerables, ChartDataLabels);
export { Chart };
