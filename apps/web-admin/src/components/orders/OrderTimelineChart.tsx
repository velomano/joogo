'use client';

import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Title);

interface TimelineData {
  date: string;
  orders: number;
  completed: number;
  cancelled: number;
  pending: number;
}

interface OrderTimelineChartProps {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  refreshTrigger: number;
}

export default function OrderTimelineChart({ 
  from, 
  to, 
  region, 
  channel, 
  category, 
  sku, 
  refreshTrigger 
}: OrderTimelineChartProps) {
  const [data, setData] = useState<TimelineData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        from,
        to,
        ...(region && region.length > 0 && { region: region.join(',') }),
        ...(channel && channel.length > 0 && { channel: channel.join(',') }),
        ...(category && category.length > 0 && { category: category.join(',') }),
        ...(sku && sku.length > 0 && { sku: sku.join(',') }),
      });

      const response = await fetch(`/api/orders/timeline?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order timeline data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching order timeline data:', err);
      setError('주문 타임라인 데이터를 불러오는 중 오류가 발생했습니다.');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [from, to, region, channel, category, sku, refreshTrigger]);

  if (isLoading) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        주문 타임라인 데이터를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#ef4444'
      }}>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        데이터 없음
      </div>
    );
  }

  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: '총 주문수',
        data: data.map(item => item.orders),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: '완료',
        data: data.map(item => item.completed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: false
      },
      {
        label: '취소',
        data: data.map(item => item.cancelled),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: false
      },
      {
        label: '처리중',
        data: data.map(item => item.pending),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4,
        fill: false
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: '일별 주문 처리 현황',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}건`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#374151'
        }
      },
      y: {
        ticks: {
          color: '#ffffff',
          font: {
            size: 11
          }
        },
        grid: {
          color: '#374151'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  return (
    <div style={{ 
      backgroundColor: '#1f2937', 
      border: '1px solid #374151', 
      borderRadius: '8px', 
      padding: '20px'
    }}>
      <div style={{ height: '300px', marginBottom: '20px' }}>
        <Line data={chartData} options={options} />
      </div>
      
      {/* 요약 통계 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '12px' 
      }}>
        <div style={{
          backgroundColor: '#111827',
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 주문수</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
            {data.reduce((sum, item) => sum + item.orders, 0)}건
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#111827',
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>완료율</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
            {data.length > 0 ? 
              ((data.reduce((sum, item) => sum + item.completed, 0) / 
                data.reduce((sum, item) => sum + item.orders, 0)) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#111827',
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>취소율</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
            {data.length > 0 ? 
              ((data.reduce((sum, item) => sum + item.cancelled, 0) / 
                data.reduce((sum, item) => sum + item.orders, 0)) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div style={{
          backgroundColor: '#111827',
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>처리중</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f59e0b' }}>
            {data.reduce((sum, item) => sum + item.pending, 0)}건
          </div>
        </div>
      </div>
    </div>
  );
}
