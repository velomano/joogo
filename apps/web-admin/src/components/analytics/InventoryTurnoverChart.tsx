'use client';

import React, { useState, useEffect } from 'react';

interface InventoryTurnoverData {
  sku: string;
  productName: string;
  category: string;
  currentStock: number;
  avgDailySales: number;
  turnoverRate: number;
  daysOfSupply: number;
  reorderPoint: number;
  status: 'healthy' | 'low' | 'critical' | 'overstock';
}

interface InventoryTurnoverChartProps {
  filters: {
    search?: string;
    from?: string;
    to?: string;
  };
}

export default function InventoryTurnoverChart({ filters }: InventoryTurnoverChartProps) {
  const [data, setData] = useState<InventoryTurnoverData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'turnoverRate' | 'daysOfSupply' | 'currentStock'>('turnoverRate');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (filters.search) {
          params.append('search', filters.search);
        }

        const response = await fetch(`/api/analytics/inventory-turnover?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory turnover data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching inventory turnover data:', err);
        setError('재고 회전율 데이터를 불러오는 중 오류가 발생했습니다.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.search, filters.from, filters.to]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return '#10b981';
      case 'low': return '#f59e0b';
      case 'critical': return '#ef4444';
      case 'overstock': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return '양호';
      case 'low': return '부족';
      case 'critical': return '위험';
      case 'overstock': return '과재고';
      default: return '알 수 없음';
    }
  };

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'turnoverRate':
        return b.turnoverRate - a.turnoverRate;
      case 'daysOfSupply':
        return a.daysOfSupply - b.daysOfSupply;
      case 'currentStock':
        return b.currentStock - a.currentStock;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '8px', 
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', color: '#9ca3af' }}>
          재고 회전율 데이터를 불러오는 중...
        </div>
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
        marginBottom: '20px'
      }}>
        <div style={{ textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      backgroundColor: '#1f2937', 
      border: '1px solid #374151', 
      borderRadius: '8px', 
      padding: '20px',
      marginBottom: '20px'
    }}>
      <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 8px 0', color: '#ffffff' }}>
        재고 회전율 분석
      </h3>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        상품별 재고 회전율과 공급일수를 분석하여 재고 효율성을 파악할 수 있습니다.
      </p>

      {/* 정렬 옵션 */}
      <div style={{ marginBottom: '16px' }}>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          style={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            padding: '8px 12px',
            color: '#ffffff',
            fontSize: '14px'
          }}
        >
          <option value="turnoverRate">회전율 순</option>
          <option value="daysOfSupply">공급일수 순</option>
          <option value="currentStock">재고량 순</option>
        </select>
      </div>

      {/* 재고 회전율 테이블 */}
      <div style={{ 
        backgroundColor: '#1f2937', 
        border: '1px solid #374151', 
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
          gap: '1px',
          backgroundColor: '#374151'
        }}>
          {/* 헤더 */}
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>SKU</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>상품명</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>현재재고</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>일평균판매</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>회전율</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>공급일수</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>재주문점</div>
          <div style={{ 
            backgroundColor: '#1f2937', 
            padding: '12px 8px', 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#d1d5db',
            textAlign: 'center'
          }}>상태</div>
        </div>

        {/* 데이터 행 */}
        {sortedData.map((item, index) => (
          <div key={item.sku} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 1fr',
            gap: '1px',
            backgroundColor: '#374151'
          }}>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.sku}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'left'
            }}>{item.productName}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.currentStock.toLocaleString()}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.avgDailySales.toFixed(1)}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.turnoverRate.toFixed(1)}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.daysOfSupply}일</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: '#ffffff',
              textAlign: 'center'
            }}>{item.reorderPoint.toLocaleString()}</div>
            <div style={{ 
              backgroundColor: '#1f2937', 
              padding: '12px 8px', 
              fontSize: '12px', 
              color: getStatusColor(item.status),
              textAlign: 'center',
              fontWeight: 'bold'
            }}>{getStatusText(item.status)}</div>
          </div>
        ))}
      </div>

      {/* 요약 통계 */}
      <div style={{ 
        marginTop: '16px', 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: '12px' 
      }}>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 회전율</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {(data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length).toFixed(1)}
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>위험 상품</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
            {data.filter(item => item.status === 'critical').length}개
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>과재고 상품</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {data.filter(item => item.status === 'overstock').length}개
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 재고 가치</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.reduce((sum, item) => sum + (item.currentStock * 50000), 0).toLocaleString()}원
          </div>
        </div>
      </div>
    </div>
  );
}
