'use client';

import React, { useState, useEffect } from 'react';

interface InventoryValueData {
  category: string;
  totalValue: number;
  totalQuantity: number;
  avgUnitCost: number;
  turnoverRate: number;
  valueShare: number;
  growthRate: number;
}

interface InventoryValueChartProps {
  filters: {
    search?: string;
    from?: string;
    to?: string;
  };
}

export default function InventoryValueChart({ filters }: InventoryValueChartProps) {
  const [data, setData] = useState<InventoryValueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'totalValue' | 'turnoverRate' | 'growthRate'>('totalValue');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
        });

        const response = await fetch(`/api/analytics/inventory-value?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory value data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching inventory value data:', err);
        setError('재고 가치 데이터를 불러오는 중 오류가 발생했습니다.');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.search, filters.from, filters.to]);

  const sortedData = [...data].sort((a, b) => {
    switch (sortBy) {
      case 'totalValue':
        return b.totalValue - a.totalValue;
      case 'turnoverRate':
        return b.turnoverRate - a.turnoverRate;
      case 'growthRate':
        return b.growthRate - a.growthRate;
      default:
        return 0;
    }
  });

  const totalValue = data.reduce((sum, item) => sum + item.totalValue, 0);

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
          재고 가치 데이터를 불러오는 중...
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
        재고 가치 분석
      </h3>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        카테고리별 재고 가치와 회전율을 분석하여 재고 투자 효율성을 파악할 수 있습니다.
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
          <option value="totalValue">총 가치 순</option>
          <option value="turnoverRate">회전율 순</option>
          <option value="growthRate">성장률 순</option>
        </select>
      </div>

      {/* 카테고리별 재고 가치 카드들 */}
      <div style={{ display: 'grid', gap: '12px', marginBottom: '20px' }}>
        {sortedData.map((item, index) => (
          <div key={item.category} style={{ 
            backgroundColor: '#374151', 
            border: '1px solid #4b5563', 
            borderRadius: '6px', 
            padding: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                  {item.category}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  총 {item.totalQuantity.toLocaleString()}개 • 평균 단가 {item.avgUnitCost.toLocaleString()}원
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
                  {item.totalValue.toLocaleString()}원
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {item.valueShare.toFixed(1)}% 점유율
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>회전율</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                  {item.turnoverRate.toFixed(1)}회
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>성장률</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: item.growthRate > 0 ? '#10b981' : '#ef4444' }}>
                  {item.growthRate > 0 ? '+' : ''}{item.growthRate.toFixed(1)}%
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 단가</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff' }}>
                  {item.avgUnitCost.toLocaleString()}원
                </div>
              </div>
            </div>

            {/* 진행률 바 */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#1f2937', 
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  width: `${item.valueShare}%`, 
                  height: '100%', 
                  backgroundColor: '#3b82f6',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 요약 통계 */}
      <div style={{ 
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
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 재고 가치</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {totalValue.toLocaleString()}원
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 회전율</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.turnoverRate, 0) / data.length).toFixed(1) : 0}회
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 성장률</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.length > 0 ? (data.reduce((sum, item) => sum + item.growthRate, 0) / data.length).toFixed(1) : 0}%
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 상품 수</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.reduce((sum, item) => sum + item.totalQuantity, 0).toLocaleString()}개
          </div>
        </div>
      </div>
    </div>
  );
}
