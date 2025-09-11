'use client';

import { useState, useEffect } from 'react';
import { Adapters } from '../_data/adapters';

interface InsightCardProps {
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  description: string;
  icon: string;
  color: string;
  onClick?: () => void;
}

function InsightCard({ title, value, trend, description, icon, color, onClick }: InsightCardProps) {
  const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';
  
  return (
    <div 
      style={{
        background: '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '6px',
        padding: '12px',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.background = '#374151';
          e.currentTarget.style.borderColor = '#6b7280';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.background = '#2d3748';
          e.currentTarget.style.borderColor = '#4a5568';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', marginRight: '6px' }}>{icon}</span>
        <h3 style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#e2e8f0',
          margin: 0 
        }}>
          {title}
        </h3>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <div style={{ 
          fontSize: '16px', 
          fontWeight: '700', 
          color: color,
          marginBottom: '3px'
        }}>
          {value}
        </div>
        <div style={{ 
          fontSize: '10px', 
          color: '#a0aec0',
          display: 'flex',
          alignItems: 'center',
          lineHeight: '1.3'
        }}>
          <span style={{ marginRight: '3px' }}>{trendIcon}</span>
          {description}
        </div>
      </div>
    </div>
  );
}

interface InsightCardsProps {
  refreshTrigger: number;
  from: string;
  to: string;
  region?: string[];
  channel?: string[];
  category?: string[];
  sku?: string[];
}

export default function InsightCards({
  refreshTrigger,
  from,
  to,
  region = [],
  channel = [],
  category = [],
  sku = []
}: InsightCardsProps) {
  console.log('InsightCards 컴포넌트 렌더링:', { from, to });

  const [insights, setInsights] = useState<InsightCardProps[]>([]);
  const [loading, setLoading] = useState(true);
  const [popupData, setPopupData] = useState<{
    type: 'temperature' | 'roas' | 'reorder' | 'discontinued' | 'repurchase';
    title: string;
    data: any;
  } | null>(null);

  useEffect(() => {
    const fetchInsights = async () => {
      console.log('InsightCards useEffect 실행:', { from, to, region, channel, category, sku });
      setLoading(true);
      try {
        // 캘린더 데이터 가져오기
        const calendarData = await Adapters.calendarHeatmap(
          { from, to },
          { region, channel, category, sku }
        );
        console.log('InsightCards 캘린더 데이터:', calendarData.length);

        // 기온 데이터 가져오기
        const weatherData = await Adapters.weather({ from, to }, { region: ['SEOUL'] });

        // 매출 및 광고비 데이터
        const totalRevenue = calendarData.reduce((sum, item) => sum + item.revenue, 0);
        const totalSpend = calendarData.reduce((sum, item) => sum + (item.spend || 0), 0);
        const avgTemperature = weatherData.length > 0 
          ? weatherData.reduce((sum, item) => sum + (item.tavg || 0), 0) / weatherData.length 
          : 0;

        // 기온과 매출의 상관관계 분석
        const tempRevenueCorrelation = calculateCorrelation(
          weatherData.map(w => w.tavg || 0),
          calendarData.map(c => c.revenue)
        );

        // 광고비와 매출의 상관관계 분석
        const spendRevenueCorrelation = calculateCorrelation(
          calendarData.map(c => c.spend || 0),
          calendarData.map(c => c.revenue)
        );

        // 재고 분석 (Mock 데이터 기반)
        const avgDailyRevenue = totalRevenue / calendarData.length;
        const estimatedStock = Math.round(avgDailyRevenue / 50000 * 30); // 30일치 재고 추정
        const reorderPoint = Math.round(estimatedStock * 0.2); // 재고의 20% 수준에서 리오더

        // 단종 후보 상품 분석 (매출 하위 20%)
        const skuPerformance = analyzeSkuPerformance(calendarData);
        const discontinuedCandidates = skuPerformance
          .filter(sku => sku.revenue < totalRevenue * 0.05) // 전체 매출의 5% 미만
          .slice(0, 3);

        // 인사이트 카드 데이터 생성
        const newInsights: InsightCardProps[] = [
          {
            title: '기온과 판매량 상관관계',
            value: `${Math.abs(tempRevenueCorrelation * 100).toFixed(0)}%`,
            trend: tempRevenueCorrelation > 0.3 ? 'up' : tempRevenueCorrelation < -0.3 ? 'down' : 'stable',
            description: tempRevenueCorrelation > 0.3 
              ? '기온 상승 시 판매량 증가' 
              : tempRevenueCorrelation < -0.3 
                ? '기온 하락 시 판매량 증가' 
                : '기온과 판매량 무관',
            icon: '🌡️',
            color: tempRevenueCorrelation > 0.3 ? '#10b981' : tempRevenueCorrelation < -0.3 ? '#3b82f6' : '#6b7280'
          },
          {
            title: '광고비 효율성',
            value: totalSpend > 0 ? `${(totalRevenue / totalSpend).toFixed(1)}x` : 'N/A',
            trend: totalSpend > 0 && (totalRevenue / totalSpend) > 3 ? 'up' : 'stable',
            description: totalSpend > 0 
              ? `광고비 1원당 ${(totalRevenue / totalSpend).toFixed(1)}원 매출` 
              : '광고비 데이터 없음',
            icon: '💰',
            color: totalSpend > 0 && (totalRevenue / totalSpend) > 3 ? '#10b981' : '#6b7280'
          },
          {
            title: '리오더 시점',
            value: `${reorderPoint}개`,
            trend: 'stable',
            description: `현재 재고 ${estimatedStock}개 중 ${reorderPoint}개 이하 시 리오더 권장`,
            icon: '📦',
            color: '#3b82f6'
          },
          {
            title: '단종 후보 상품',
            value: `${discontinuedCandidates.length}개`,
            trend: discontinuedCandidates.length > 0 ? 'down' : 'stable',
            description: discontinuedCandidates.length > 0 
              ? `매출 하위 상품 ${discontinuedCandidates.length}개 단종 검토` 
              : '단종 후보 없음',
            icon: '⚠️',
            color: discontinuedCandidates.length > 0 ? '#ef4444' : '#10b981'
          }
        ];

        console.log('InsightCards 인사이트 생성 완료:', newInsights);
        setInsights(newInsights);
      } catch (error) {
        console.error('인사이트 데이터 로드 실패:', error);
        setInsights([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [from, to, region, channel, category, sku, refreshTrigger]);

  // 팝업 컴포넌트
  const PopupModal = () => {
    if (!popupData) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={() => setPopupData(null)}
      >
        <div style={{
          background: '#1a202c',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '80vw',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid #4a5568',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setPopupData(null)}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              fontSize: '24px',
              cursor: 'pointer'
            }}
          >
            ×
          </button>
          
          <h2 style={{ 
            color: '#e2e8f0', 
            marginBottom: '20px',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            {popupData.title}
          </h2>

          {popupData.type === 'temperature' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                기온과 판매량의 상관관계를 보여주는 차트가 여기에 표시됩니다.
              </p>
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#a0aec0'
              }}>
                📊 기온-판매량 상관관계 차트<br/>
                (실제 구현시 SalesTemperatureChart 컴포넌트를 여기에 삽입)
              </div>
            </div>
          )}

          {popupData.type === 'roas' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                광고비 투자 효율성 상세 분석
              </p>
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#a0aec0'
              }}>
                💰 ROAS 상세 차트<br/>
                (실제 구현시 RevenueSpendChart 컴포넌트를 여기에 삽입)
              </div>
            </div>
          )}

          {popupData.type === 'discontinued' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                단종 후보 상품 목록
              </p>
              <div style={{ background: '#2d3748', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '12px' }}>
                  단종 검토 권장 상품:
                </div>
                <div style={{ color: '#a0aec0' }}>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                    • 상품 A (SKU: ABC123) - 지난 30일 판매량: 5개
                  </div>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                    • 상품 B (SKU: DEF456) - 지난 30일 판매량: 8개
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    • 상품 C (SKU: GHI789) - 지난 30일 판매량: 3개
                  </div>
                </div>
              </div>
            </div>
          )}

          {popupData.type === 'reorder' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                재고 리오더 상세 정보
              </p>
              <div style={{ background: '#2d3748', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '12px' }}>
                  긴급 리오더 필요 상품:
                </div>
                <div style={{ color: '#a0aec0' }}>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                    • 상품 X (SKU: XYZ001) - 현재 재고: 15개, 예상 소진일: 3일 후
                  </div>
                  <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                    • 상품 Y (SKU: XYZ002) - 현재 재고: 8개, 예상 소진일: 2일 후
                  </div>
                  <div style={{ padding: '8px 0' }}>
                    • 상품 Z (SKU: XYZ003) - 현재 재고: 5개, 예상 소진일: 1일 후
                  </div>
                </div>
              </div>
            </div>
          )}


          {popupData.type === 'repurchase' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                고객 재구매율 분석
              </p>
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                textAlign: 'center',
                color: '#a0aec0'
              }}>
                📈 고객 재구매율 상세 차트<br/>
                (실제 구현시 관련 차트 컴포넌트를 여기에 삽입)
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{
            background: '#f3f4f6',
            borderRadius: '8px',
            height: '120px',
            animation: 'pulse 2s infinite'
          }} />
        ))}
      </div>
    );
  }

  // 테스트용 인사이트 카드 (데이터가 없을 때)
  if (insights.length === 0) {
    const testInsights: InsightCardProps[] = [
      {
        title: '기온 vs 판매량 상관관계',
        value: '0.75',
        trend: 'up',
        description: '기온 1도 상승시 판매량 12% 증가 예상',
        icon: '🌡️',
        color: '#3b82f6'
      },
      {
        title: '광고비 투자 효율성',
        value: '4.2x ROAS',
        trend: 'up',
        description: '광고비 100만원당 420만원 매출 발생',
        icon: '💰',
        color: '#10b981'
      },
      {
        title: '재고 리오더 알림',
        value: '3일 후',
        trend: 'down',
        description: '현재 재고로 3일간 판매 가능, 긴급 주문 필요',
        icon: '📦',
        color: '#f59e0b'
      },
      {
        title: '단종 후보 상품',
        value: '2개 상품',
        trend: 'down',
        description: '지난 30일 판매량 10개 미만, 단종 검토 권장',
        icon: '⚠️',
        color: '#ef4444'
      },
      {
        title: '고객 재구매율',
        value: '68%',
        trend: 'up',
        description: '지난 3개월 고객 중 68%가 재구매 완료',
        icon: '🔄',
        color: '#06b6d4'
      }
    ];

    return (
      <>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px',
          marginBottom: '24px'
        }}>
          {testInsights.map((insight, index) => (
            <InsightCard 
              key={index} 
              {...insight} 
              onClick={() => {
                const typeMap: { [key: string]: 'temperature' | 'roas' | 'reorder' | 'discontinued' | 'repurchase' } = {
                  '기온 vs 판매량 상관관계': 'temperature',
                  '광고비 투자 효율성': 'roas',
                  '재고 리오더 알림': 'reorder',
                  '단종 후보 상품': 'discontinued',
                  '고객 재구매율': 'repurchase'
                };
                
                const type = typeMap[insight.title];
                if (type) {
                  setPopupData({
                    type,
                    title: insight.title,
                    data: null
                  });
                }
              }}
            />
          ))}
        </div>
        <PopupModal />
      </>
    );
  }

  return (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        {insights.map((insight, index) => (
          <InsightCard 
            key={index} 
            {...insight} 
            onClick={() => {
              // 실제 데이터에서도 팝업을 표시할 수 있도록 확장 가능
              console.log('인사이트 카드 클릭:', insight.title);
            }}
          />
        ))}
      </div>
      <PopupModal />
    </>
  );
}

// 상관관계 계산 함수
function calculateCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) return 0;
  
  const n = x.length;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
  
  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

// SKU 성능 분석 함수
function analyzeSkuPerformance(data: any[]): Array<{sku: string, revenue: number}> {
  const skuMap = new Map<string, number>();
  
  data.forEach(item => {
    const sku = item.sku || 'UNKNOWN';
    skuMap.set(sku, (skuMap.get(sku) || 0) + item.revenue);
  });
  
  return Array.from(skuMap.entries())
    .map(([sku, revenue]) => ({ sku, revenue }))
    .sort((a, b) => b.revenue - a.revenue);
}
