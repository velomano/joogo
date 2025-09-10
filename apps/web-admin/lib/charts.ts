import { Chart, ChartConfiguration, ChartData, ChartOptions } from 'chart.js';

export function ensureChart(canvas: HTMLCanvasElement | null, config: ChartConfiguration) {
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  // 기존 차트가 있으면 제거
  const existingChart = Chart.getChart(canvas);
  if (existingChart) {
    existingChart.destroy();
  }
  
  // 새 차트 생성
  new Chart(ctx, config);
}

export function lineConfig(data: ChartData<'line'>): ChartConfiguration<'line'> {
  return {
    type: 'line',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };
}

export function barConfig(data: ChartData<'bar'>): ChartConfiguration<'bar'> {
  return {
    type: 'bar',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    },
  };
}

export function doughnutConfig(data: ChartData<'doughnut'>): ChartConfiguration<'doughnut'> {
  return {
    type: 'doughnut',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
      },
    },
  };
}

export function scatterConfig(data: ChartData<'scatter'>): ChartConfiguration<'scatter'> {
  return {
    type: 'scatter',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  };
}

export function scatterWithTrendConfig(data: ChartData<'scatter'>): ChartConfiguration<'scatter'> {
  return {
    type: 'scatter',
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
        },
        y: {
          beginAtZero: true,
        },
      },
    },
  };
}
