'use client';

import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, Title);

interface ProcessingTimeData {
  timeRange: string;
  count: number;
  percentage: number;
  color: string;
}

interface OrderProcessingChartProps {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  refreshTrigger: number;
}

export default function OrderProcessingChart({ 
  from, 
  to, 
  region, 
  channel, 
  category, 
  sku, 
  refreshTrigger 
}: OrderProcessingChartProps) {
  const [data, setData] = useState<ProcessingTimeData[]>([]);
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

      const response = await fetch(`/api/orders/processing-time?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch order processing time data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching order processing time data:', err);
      setError('주문 처리 시간 데이터를 불러오는 중 오류가 발생했습니다.');
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
        주문 처리 시간 데이터를 불러오는 중...
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
    labels: data.map(item => item.timeRange),
    datasets: [
      {
        label: '주문 수',
        data: data.map(item => item.count),
        backgroundColor: data.map(item => item.color),
        borderColor: data.map(item => item.color),
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '주문 처리 시간 분포',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const item = data[context.dataIndex];
            return `${item.timeRange}: ${item.count}건 (${item.percentage.toFixed(1)}%)`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#ffffff',
          font: {
            size: 12
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
            size: 12
          }
        },
        grid: {
          color: '#374151'
        }
      }
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
        <Bar data={chartData} options={options} />
      </div>
      
      {/* 처리 시간별 상세 정보 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '12px' 
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            backgroundColor: '#111827',
            padding: '12px',
            borderRadius: '6px',
            border: `2px solid ${item.color}`,
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '12px', 
              color: '#9ca3af', 
              marginBottom: '4px' 
            }}>
              {item.timeRange}
            </div>
            <div style={{ 
              fontSize: '18px', 
              fontWeight: 'bold', 
              color: item.color,
              marginBottom: '4px'
            }}>
              {item.count}건
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#6b7280' 
            }}>
              {item.percentage.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      
      {/* 요약 통계 */}
      <div style={{ 
        marginTop: '20px',
        padding: '16px',
        backgroundColor: '#111827',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 처리 시간</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
            {data.length > 0 ? 
              (data.reduce((sum, item, index) => {
                const hours = index === 0 ? 1 : index === 1 ? 6 : index === 2 ? 12 : index === 3 ? 24 : 48;
                return sum + (item.count * hours);
              }, 0) / data.reduce((sum, item) => sum + item.count, 0)).toFixed(1) : 0}시간
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>빠른 처리율</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
            {data.length > 0 ? 
              ((data[0]?.count || 0) / data.reduce((sum, item) => sum + item.count, 0) * 100).toFixed(1) : 0}%
          </div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>지연 처리율</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
            {data.length > 0 ? 
              ((data[data.length - 1]?.count || 0) / data.reduce((sum, item) => sum + item.count, 0) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
