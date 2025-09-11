'use client';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import 'chartjs-adapter-date-fns';

// Chart.js 기본 등록 + date adapter
Chart.register(...registerables, ChartDataLabels);

// 전문적인 차트 기본 설정
Chart.defaults.font.family = "'Inter', 'Segoe UI', 'Roboto', sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = '#6B7280';
Chart.defaults.borderColor = '#E5E7EB';
Chart.defaults.backgroundColor = 'rgba(59, 130, 246, 0.1)';

// 공통 옵션 설정
export const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top' as const,
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 11,
          weight: '500' as const
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(17, 24, 39, 0.95)',
      titleColor: '#F9FAFB',
      bodyColor: '#F9FAFB',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      padding: 12,
      titleFont: {
        size: 12,
        weight: 'bold' as const
      },
      bodyFont: {
        size: 11
      },
      callbacks: {
        label: function(context: any) {
          const label = context.dataset.label || '';
          const value = context.parsed.y || context.parsed;
          if (typeof value === 'number') {
            if (value >= 1000000) {
              return `${label}: ₩${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${label}: ₩${(value / 1000).toFixed(1)}K`;
            } else {
              return `${label}: ₩${value.toLocaleString()}`;
            }
          }
          return `${label}: ${value}`;
        }
      }
    },
    datalabels: {
      display: false
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: 'rgba(229, 231, 235, 0.5)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        color: '#6B7280',
        maxRotation: 45,
        minRotation: 0
      },
      border: {
        display: false
      }
    },
    y: {
      grid: {
        display: true,
        color: 'rgba(229, 231, 235, 0.5)',
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        color: '#6B7280',
        callback: function(value: any) {
          if (typeof value === 'number') {
            if (value >= 1000000) {
              return `₩${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `₩${(value / 1000).toFixed(1)}K`;
            } else {
              return `₩${value.toLocaleString()}`;
            }
          }
          return value;
        }
      },
      border: {
        display: false
      }
    }
  },
  elements: {
    point: {
      radius: 4,
      hoverRadius: 6,
      borderWidth: 2
    },
    line: {
      tension: 0.4,
      borderWidth: 2
    },
    bar: {
      borderRadius: 4,
      borderSkipped: false
    }
  }
};

// 전문적인 색상 팔레트
export const colorPalette = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  danger: '#EF4444',
  warning: '#F97316',
  info: '#06B6D4',
  success: '#22C55E',
  purple: '#8B5CF6',
  pink: '#EC4899',
  indigo: '#6366F1',
  teal: '#14B8A6',
  orange: '#F97316',
  cyan: '#06B6D4',
  emerald: '#10B981',
  lime: '#84CC16',
  amber: '#F59E0B',
  red: '#EF4444',
  rose: '#F43F5E',
  slate: '#64748B',
  gray: '#6B7280',
  zinc: '#71717A',
  neutral: '#737373',
  stone: '#78716C'
};

export { Chart };
