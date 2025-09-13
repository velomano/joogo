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

interface RegionalShippingData {
  region: string;
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  cancelledOrders: number;
  completionRate: number;
  avgDeliveryDays: number;
}

interface RegionalShippingChartProps {
  from: string;
  to: string;
  region: string[];
  channel: string[];
  category: string[];
  sku: string[];
  refreshTrigger: number;
}

export default function RegionalShippingChart({ 
  from, 
  to, 
  region, 
  channel, 
  category, 
  sku, 
  refreshTrigger 
}: RegionalShippingChartProps) {
  const [data, setData] = useState<RegionalShippingData[]>([]);
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

      const response = await fetch(`/api/shipping/regional?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch regional shipping data');
      }

      const result = await response.json();
      setData(result.data || []);
    } catch (err) {
      console.error('Error fetching regional shipping data:', err);
      setError('지역별 배송 데이터를 불러오는 중 오류가 발생했습니다.');
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
        지역별 배송 데이터를 불러오는 중...
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
    labels: data.map(item => item.region),
    datasets: [
      {
        label: '총 주문수',
        data: data.map(item => item.totalOrders),
        backgroundColor: '#3b82f6',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
      {
        label: '완료',
        data: data.map(item => item.completedOrders),
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        borderWidth: 2,
      },
      {
        label: '처리중',
        data: data.map(item => item.pendingOrders),
        backgroundColor: '#f59e0b',
        borderColor: '#f59e0b',
        borderWidth: 2,
      },
      {
        label: '취소',
        data: data.map(item => item.cancelledOrders),
        backgroundColor: '#ef4444',
        borderColor: '#ef4444',
        borderWidth: 2,
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
        text: '지역별 배송 현황',
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
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
      
      {/* 지역별 상세 정보 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px' 
      }}>
        {data.map((item, index) => (
          <div key={index} style={{
            backgroundColor: '#111827',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #374151'
          }}>
            <div style={{ 
              fontSize: '16px', 
              fontWeight: 'bold', 
              color: '#ffffff',
              marginBottom: '12px'
            }}>
              {item.region}
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 주문수</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#3b82f6' }}>
                {item.totalOrders}건
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>완료율</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                {item.completionRate.toFixed(1)}%
              </div>
            </div>
            
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 배송일</div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#8b5cf6' }}>
                {item.avgDeliveryDays.toFixed(1)}일
              </div>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#9ca3af'
            }}>
              <span>완료: {item.completedOrders}</span>
              <span>처리중: {item.pendingOrders}</span>
              <span>취소: {item.cancelledOrders}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
