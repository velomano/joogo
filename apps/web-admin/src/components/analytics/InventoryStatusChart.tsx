'use client';

import React, { useState, useEffect } from 'react';

interface InventoryData {
  category: string;
  totalProducts: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
  inventoryValue: number;
  turnoverRate: number;
}

interface InventoryAnalytics {
  summary: {
    totalProducts: number;
    inStockProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
    totalInventoryValue: number;
    avgTurnoverRate: number;
  };
  categories: InventoryData[];
  insights: {
    topCategory: string;
    attentionNeeded: string;
    recommendation: string;
  };
}

interface InventoryStatusChartProps {
  filters: {
    search?: string;
    from?: string;
    to?: string;
  };
}

export default function InventoryStatusChart({ filters }: InventoryStatusChartProps) {
  const [data, setData] = useState<InventoryAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          search: filters.search || '',
        });

        const response = await fetch(`/api/analytics/inventory?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching inventory turnover data:', err);
        setError('재고 데이터를 불러오는 중 오류가 발생했습니다.');
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

  // data는 객체이므로 categories 배열을 사용
  const categories = data?.categories || [];

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
          재고 데이터를 불러오는 중...
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
        📦 재고 현황
      </h3>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        카테고리별 재고 상태를 모니터링하여 효율적인 재고 관리를 할 수 있습니다.
      </p>

      {/* 기본 재고 지표 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '16px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>총 SKU</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {data?.summary?.totalProducts || 0}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 충분</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
            {data?.summary?.inStockProducts || 0}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 부족</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
            {data?.summary?.lowStockProducts || 0}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
            {data?.summary?.outOfStockProducts || 0}개
          </div>
        </div>
      </div>

      {/* 카테고리별 재고 현황 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        {categories.map((category) => (
          <div key={category.category} style={{ 
            backgroundColor: '#374151', 
            padding: '16px', 
            borderRadius: '8px' 
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#ffffff' }}>
              {category.category}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>총 상품</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {category.totalProducts}개
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>재고 가치</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {(category.inventoryValue / 1000000).toFixed(1)}M원
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>충분</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                  {category.inStock}개
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>부족</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {category.lowStock}개
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>품절</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                  {category.outOfStock}개
                </div>
              </div>
            </div>

            <div style={{ marginTop: '12px', padding: '8px', backgroundColor: '#1f2937', borderRadius: '4px' }}>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>회전율</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>
                {category.turnoverRate.toFixed(1)}회
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 인사이트 */}
      <div style={{ backgroundColor: '#374151', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#ffffff' }}>
          📊 재고 인사이트
        </h4>
        <div style={{ display: 'grid', gap: '8px' }}>
          <div style={{ fontSize: '14px', color: '#d1d5db' }}>
            <strong style={{ color: '#10b981' }}>최고 성과:</strong> {data?.insights?.topCategory}
          </div>
          <div style={{ fontSize: '14px', color: '#d1d5db' }}>
            <strong style={{ color: '#f59e0b' }}>주의 필요:</strong> {data?.insights?.attentionNeeded}
          </div>
          <div style={{ fontSize: '14px', color: '#d1d5db' }}>
            <strong style={{ color: '#3b82f6' }}>권장사항:</strong> {data?.insights?.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
}
