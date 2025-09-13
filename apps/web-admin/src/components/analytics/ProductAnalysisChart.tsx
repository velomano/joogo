'use client';

import { useEffect, useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/lib/format';

interface ProductData {
  productId: string;
  productName: string;
  category: string;
  sku: string;
  revenue: number;
  quantity: number;
  orders: number;
  avgPrice: number;
  profit: number;
  stock: number;
  hits: number;
  conversionRate: number;
  returnRate: number;
  revenueShare: string;
  quantityShare: string;
  profitMargin: string;
  inventoryTurnover: string;
  performanceScore: string;
}

interface ProductAnalytics {
  products: ProductData[];
  summary: {
    totalRevenue: number;
    totalQuantity: number;
    totalOrders: number;
    totalProfit: number;
    avgPrice: string;
    avgConversionRate: string;
    avgReturnRate: string;
    totalProfitMargin: string;
  };
  period: {
    from: string;
    to: string;
    days: number;
  };
}

interface ProductAnalysisChartProps {
  filters: {
    from: string;
    to: string;
    region?: string;
    channel?: string;
    category?: string;
    sku?: string;
  };
}

export default function ProductAnalysisChart({ filters }: ProductAnalysisChartProps) {
  const [data, setData] = useState<ProductAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          from: filters.from,
          to: filters.to,
          ...(filters.category && { category: filters.category })
        });

        const response = await fetch(`/api/analytics/products?${params}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setData(result);
      } catch (err) {
        console.error('Error fetching product analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [filters]);

  if (loading) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📦</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>상품별 성과 분석</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
            <div style={{ color: '#6b7280' }}>데이터를 불러오는 중...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📦</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>상품별 성과 분석</h3>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
          <div style={{ textAlign: 'center', color: '#ef4444' }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>❌</div>
            <div>데이터 로딩 실패: {error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const categories = ['all', ...Array.from(new Set(data.products.map(p => p.category)))];
  const filteredProducts = selectedCategory === 'all' 
    ? data.products 
    : data.products.filter(p => p.category === selectedCategory);

  const categoryColors = {
    'TOPS': '#3b82f6',
    'BOTTOMS': '#10b981',
    'OUTER': '#f59e0b',
    'SHOES': '#ef4444',
    'BAGS': '#8b5cf6',
    'ACC': '#06b6d4'
  };

  return (
    <div className="chart-container" style={{ padding: '20px', minHeight: '400px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>📦</span>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>상품별 성과 분석</h3>
        </div>
        
        {/* 카테고리 필터 */}
        <select 
          value={selectedCategory} 
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '14px',
            backgroundColor: '#ffffff'
          }}
        >
          <option value="all">전체 카테고리</option>
          {categories.slice(1).map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {/* 요약 지표 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px', 
        marginBottom: '24px' 
      }}>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>총 매출</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(data.summary.totalRevenue)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>총 판매량</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatNumber(data.summary.totalQuantity)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>총 이익</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {formatCurrency(data.summary.totalProfit)}
          </div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>평균 마진율</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
            {data.summary.totalProfitMargin}%
          </div>
        </div>
      </div>

      {/* 상품별 상세 분석 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
        gap: '16px' 
      }}>
        {filteredProducts.map((product) => (
          <div 
            key={product.productId}
            style={{ 
              padding: '20px', 
              border: '1px solid #e5e7eb', 
              borderRadius: '12px',
              backgroundColor: '#ffffff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 'bold', margin: 0, marginBottom: '4px' }}>
                  {product.productName}
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{ 
                      padding: '2px 8px', 
                      backgroundColor: categoryColors[product.category as keyof typeof categoryColors] + '20',
                      color: categoryColors[product.category as keyof typeof categoryColors],
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}
                  >
                    {product.category}
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {product.sku}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }}>
                  {formatCurrency(product.revenue)}
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                  {product.revenueShare}% 점유율
                </div>
              </div>
            </div>

            {/* 매출 비율 바 */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ 
                width: '100%', 
                height: '8px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div 
                  style={{ 
                    width: `${product.revenueShare}%`, 
                    height: '100%', 
                    backgroundColor: categoryColors[product.category as keyof typeof categoryColors],
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* 상세 지표 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '14px'
            }}>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>판매량</div>
                <div style={{ fontWeight: 'bold' }}>{formatNumber(product.quantity)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>주문</div>
                <div style={{ fontWeight: 'bold' }}>{formatNumber(product.orders)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>평균 가격</div>
                <div style={{ fontWeight: 'bold' }}>{formatCurrency(product.avgPrice)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>이익</div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {formatCurrency(product.profit)}
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>마진율</div>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {product.profitMargin}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>재고</div>
                <div style={{ fontWeight: 'bold' }}>{formatNumber(product.stock)}</div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>전환율</div>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {product.conversionRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>반품율</div>
                <div style={{ fontWeight: 'bold', color: '#ef4444' }}>
                  {product.returnRate.toFixed(1)}%
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>재고회전율</div>
                <div style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                  {product.inventoryTurnover}회
                </div>
              </div>
              <div>
                <div style={{ color: '#6b7280', marginBottom: '2px' }}>성과점수</div>
                <div style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                  {product.performanceScore}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 기간 정보 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        backgroundColor: '#f8fafc', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#6b7280',
        textAlign: 'center'
      }}>
        분석 기간: {data.period.from} ~ {data.period.to} ({data.period.days}일) | 
        표시 상품: {filteredProducts.length}개
      </div>
    </div>
  );
}
