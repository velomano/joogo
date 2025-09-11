'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { DailyPoint } from '@/lib/BoardTypes';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PrimaryChartProps {
  data: DailyPoint[];
  selectedRange?: '7d' | '30d' | '90d' | 'ytd' | 'all';
  onRangeChange?: (range: '7d' | '30d' | '90d' | 'ytd' | 'all') => void;
}

export function PrimaryChart({ data, selectedRange = '30d', onRangeChange }: PrimaryChartProps) {
  const chartData = useMemo(() => {
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return {
      labels: sortedData.map(point => {
        const date = new Date(point.date);
        return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: '매출',
          data: sortedData.map(point => point.sales),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: 'rgb(59, 130, 246)',
          pointHoverBorderColor: 'white',
          pointHoverBorderWidth: 2,
        },
      ],
    };
  }, [data]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const dataIndex = context[0].dataIndex;
            const point = data[dataIndex];
            return new Date(point.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });
          },
          label: (context: any) => {
            const value = context.parsed.y;
            return `매출: ${new Intl.NumberFormat('ko-KR', {
              style: 'currency',
              currency: 'KRW',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: 'rgb(107, 114, 128)',
          font: {
            size: 12,
          },
          callback: (value: any) => {
            if (value >= 1000000) {
              return `${(value / 1000000).toFixed(1)}M`;
            } else if (value >= 1000) {
              return `${(value / 1000).toFixed(1)}K`;
            }
            return value;
          },
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  }), [data]);

  const rangeOptions = [
    { value: '7d', label: '7일' },
    { value: '30d', label: '30일' },
    { value: '90d', label: '90일' },
    { value: 'ytd', label: '올해' },
    { value: 'all', label: '전체' },
  ] as const;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">일별 매출 추이</h3>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onRangeChange?.(option.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedRange === option.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-80">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
