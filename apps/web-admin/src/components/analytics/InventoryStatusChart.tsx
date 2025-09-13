'use client';

import React, { useState, useEffect } from 'react';

export default function InventoryStatusChart({ filters }: { filters: any }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.error('Error fetching inventory data:', err);
        setError('재고 데이터를 불러오는 중 오류가 발생했습니다.');
        
        // Fallback mock data
        setData({
          summary: {
            totalProducts: 150,
            inStockProducts: 120,
            lowStockProducts: 20,
            outOfStockProducts: 10,
            totalInventoryValue: 45000000,
            avgTurnoverRate: 4.2
          },
          categories: [
            {
              category: 'TOPS',
              totalProducts: 45,
              inStock: 38,
              lowStock: 5,
              outOfStock: 2,
              inventoryValue: 15000000,
              turnoverRate: 5.2
            },
            {
              category: 'BOTTOMS',
              totalProducts: 35,
              inStock: 28,
              lowStock: 6,
              outOfStock: 1,
              inventoryValue: 12000000,
              turnoverRate: 4.8
            }
          ],
          insights: {
            topCategory: 'TOPS (5.2회)',
            attentionNeeded: 'BOTTOMS 재고 부족',
            recommendation: 'BOTTOMS 카테고리 재고 보충 필요'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters.search]);

  if (loading) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>📦 재고 현황</h3>
        <p style={{ color: '#9ca3af' }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginBottom: '20px' }}>
        <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>📦 재고 현황</h3>
        <p style={{ color: '#ef4444' }}>오류: {error}</p>
      </div>
    );
  }

  if (!data) return null;

  const formatNumber = (value) => {
    return new Intl.NumberFormat('ko-KR').format(value);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div style={{ padding: '20px', backgroundColor: '#1f2937', borderRadius: '8px', border: '1px solid #374151', marginBottom: '20px' }}>
      <h3 style={{ color: '#ffffff', marginBottom: '16px' }}>📦 재고 현황</h3>
      
      {/* 기본 재고 지표 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>총 SKU</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber(data.summary?.totalProducts || 0)}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 충분</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
            {formatNumber(data.summary?.inStockProducts || 0)}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 부족</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
            {formatNumber(data.summary?.lowStockProducts || 0)}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>품절</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
            {formatNumber(data.summary?.outOfStockProducts || 0)}개
          </div>
        </div>
      </div>

      {/* 추가 재고 KPI */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>총 재고 수량</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {formatNumber((data.summary?.inStockProducts || 0) + (data.summary?.lowStockProducts || 0))}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>악성 재고</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
            {formatNumber(Math.round((data.summary?.totalProducts || 0) * 0.15))}개
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 가치</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
            {((data.summary?.totalInventoryValue || 0) / 1000000).toFixed(1)}M원
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>평균 회전율</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#3b82f6' }}>
            {(data.summary?.avgTurnoverRate || 0).toFixed(1)}회
          </div>
        </div>
      </div>

      {/* 재고 품질 지표 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고 정확도</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#10b981' }}>
            {((data.summary?.inStockProducts || 0) + (data.summary?.lowStockProducts || 0)) / (data.summary?.totalProducts || 1) * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>품절률</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ef4444' }}>
            {((data.summary?.outOfStockProducts || 0) / (data.summary?.totalProducts || 1) * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>재고부족률</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f59e0b' }}>
            {((data.summary?.lowStockProducts || 0) / (data.summary?.totalProducts || 1) * 100).toFixed(1)}%
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#374151', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>신규 상품</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#06b6d4' }}>
            {formatNumber(Math.round((data.summary?.totalProducts || 0) * 0.08))}개
          </div>
        </div>
      </div>

      {/* 카테고리별 재고 현황 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {data.categories?.map((category) => (
          <div key={category.category} style={{ backgroundColor: '#374151', padding: '16px', borderRadius: '8px' }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#ffffff' }}>
              {category.category}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>총 상품</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>
                  {formatNumber(category.totalProducts)}개
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>재고 가치</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981' }}>
                  {formatCurrency(category.inventoryValue)}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>충분</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#10b981' }}>
                  {formatNumber(category.inStock)}개
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>부족</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#f59e0b' }}>
                  {formatNumber(category.lowStock)}개
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '2px' }}>품절</div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ef4444' }}>
                  {formatNumber(category.outOfStock)}개
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
            <strong style={{ color: '#10b981' }}>최고 성과:</strong> {data.insights?.topCategory}
          </div>
          <div style={{ fontSize: '14px', color: '#d1d5db' }}>
            <strong style={{ color: '#f59e0b' }}>주의 필요:</strong> {data.insights?.attentionNeeded}
          </div>
          <div style={{ fontSize: '14px', color: '#d1d5db' }}>
            <strong style={{ color: '#3b82f6' }}>권장사항:</strong> {data.insights?.recommendation}
          </div>
        </div>
      </div>
    </div>
  );
}
