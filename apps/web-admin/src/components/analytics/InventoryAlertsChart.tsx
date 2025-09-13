'use client';

import React, { useState, useEffect } from 'react';

interface InventoryAlert {
  sku: string;
  productName: string;
  category: string;
  currentStock: number;
  reorderPoint: number;
  daysUntilStockout: number;
  priority: 'high' | 'medium' | 'low';
  lastRestocked: string;
  supplier: string;
  estimatedDelivery: string;
}

interface InventoryAlertsChartProps {
  filters: {
    from: string;
    to: string;
  };
}

export default function InventoryAlertsChart({ filters }: InventoryAlertsChartProps) {
  const [data, setData] = useState<InventoryAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
        });

        const response = await fetch(`/api/analytics/inventory-alerts?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch inventory alerts data');
        }

        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Error fetching inventory alerts data:', err);
        setError('재고 알림 데이터를 불러오는 중 오류가 발생했습니다.');
        
        // Fallback mock data
        setData([
          {
            sku: 'SKU002',
            productName: '데님 재킷',
            category: '의류',
            currentStock: 25,
            reorderPoint: 30,
            daysUntilStockout: 3,
            priority: 'high',
            lastRestocked: '2024-01-15',
            supplier: '패션공급업체A',
            estimatedDelivery: '2024-01-25'
          },
          {
            sku: 'SKU007',
            productName: '후드티',
            category: '의류',
            currentStock: 18,
            reorderPoint: 35,
            daysUntilStockout: 2,
            priority: 'high',
            lastRestocked: '2024-01-10',
            supplier: '패션공급업체B',
            estimatedDelivery: '2024-01-22'
          },
          {
            sku: 'SKU004',
            productName: '가방',
            category: '액세서리',
            currentStock: 45,
            reorderPoint: 25,
            daysUntilStockout: 7,
            priority: 'medium',
            lastRestocked: '2024-01-12',
            supplier: '액세서리공급업체A',
            estimatedDelivery: '2024-01-28'
          },
          {
            sku: 'SKU009',
            productName: '스카프',
            category: '액세서리',
            currentStock: 32,
            reorderPoint: 40,
            daysUntilStockout: 4,
            priority: 'medium',
            lastRestocked: '2024-01-08',
            supplier: '액세서리공급업체B',
            estimatedDelivery: '2024-01-26'
          },
          {
            sku: 'SKU010',
            productName: '벨트',
            category: '액세서리',
            currentStock: 55,
            reorderPoint: 50,
            daysUntilStockout: 8,
            priority: 'low',
            lastRestocked: '2024-01-14',
            supplier: '액세서리공급업체C',
            estimatedDelivery: '2024-01-30'
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.from, filters.to]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return '높음';
      case 'medium': return '보통';
      case 'low': return '낮음';
      default: return '알 수 없음';
    }
  };

  const filteredData = data.filter(item => 
    filterPriority === 'all' || item.priority === filterPriority
  );

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
          재고 알림 데이터를 불러오는 중...
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
        재고 부족 알림
      </h3>
      <p style={{ fontSize: '12px', color: '#9ca3af', margin: '0 0 20px 0' }}>
        재고가 부족한 상품들을 우선순위별로 관리하여 품절을 방지할 수 있습니다.
      </p>

      {/* 필터 옵션 */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
        {[
          { value: 'all', label: '전체' },
          { value: 'high', label: '높음' },
          { value: 'medium', label: '보통' },
          { value: 'low', label: '낮음' }
        ].map((option) => (
          <button
            key={option.value}
            onClick={() => setFilterPriority(option.value as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: '1px solid #374151',
              backgroundColor: filterPriority === option.value ? '#3b82f6' : '#1f2937',
              color: filterPriority === option.value ? '#ffffff' : '#9ca3af',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* 알림 카드들 */}
      <div style={{ display: 'grid', gap: '12px' }}>
        {filteredData.map((item, index) => (
          <div key={item.sku} style={{ 
            backgroundColor: '#374151', 
            border: '1px solid #4b5563', 
            borderRadius: '6px', 
            padding: '16px',
            borderLeft: `4px solid ${getPriorityColor(item.priority)}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffffff', marginBottom: '4px' }}>
                  {item.productName}
                </div>
                <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {item.sku} • {item.category}
                </div>
              </div>
              <div style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: getPriorityColor(item.priority),
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {getPriorityText(item.priority)}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>현재 재고</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {item.currentStock.toLocaleString()}개
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>재주문점</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {item.reorderPoint.toLocaleString()}개
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>품절 예상일</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
                  {item.daysUntilStockout}일 후
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>공급업체</div>
                <div style={{ fontSize: '14px', color: '#ffffff' }}>
                  {item.supplier}
                </div>
              </div>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: '#1f2937',
              borderRadius: '4px',
              fontSize: '12px'
            }}>
              <div style={{ color: '#9ca3af' }}>
                마지막 입고: {item.lastRestocked}
              </div>
              <div style={{ color: '#3b82f6' }}>
                예상 배송: {item.estimatedDelivery}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 20px', 
          color: '#9ca3af',
          fontSize: '14px'
        }}>
          {filterPriority === 'all' ? '재고 부족 상품이 없습니다.' : `${getPriorityText(filterPriority)} 우선순위 상품이 없습니다.`}
        </div>
      )}

      {/* 요약 통계 */}
      <div style={{ 
        marginTop: '20px', 
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
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>총 알림</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.length}개
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>높은 우선순위</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
            {data.filter(item => item.priority === 'high').length}개
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>평균 품절일</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
            {data.length > 0 ? Math.round(data.reduce((sum, item) => sum + item.daysUntilStockout, 0) / data.length) : 0}일
          </div>
        </div>
        <div style={{ 
          backgroundColor: '#374151', 
          padding: '12px', 
          borderRadius: '6px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>긴급 주문 필요</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>
            {data.filter(item => item.daysUntilStockout <= 3).length}개
          </div>
        </div>
      </div>
    </div>
  );
}
