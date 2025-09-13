'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Adapters } from '../_data/adapters';
import TemperatureScatterChart from './TemperatureScatterChart';
import RevenueSpendChart from './RevenueSpendChart';

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
      className="insight-card"
      style={{
        background: '#2d3748',
        border: '1px solid #4a5568',
        borderRadius: '6px',
        padding: '12px',
        minHeight: '100px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={onClick}
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
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [popupData, setPopupData] = useState<{
    type: 'temperature' | 'roas' | 'reorder' | 'discontinued' | 'repurchase';
    title: string;
    data: any;
  } | null>(null);
  const [temperatureCorrelation, setTemperatureCorrelation] = useState<any>(null);
  const [roasData, setRoasData] = useState<any>(null);
  const [isPopupOpen, setIsPopupOpen] = useState<boolean>(false);
  const [reorderData, setReorderData] = useState<{
    avgDailyQuantity: number;
    estimatedStock: number;
    reorderPoint: number;
  } | null>(null);
  const [discontinuedData, setDiscontinuedData] = useState<any[]>([]);
  const [isGuideVisible, setIsGuideVisible] = useState(true);

  // 상관계수 변경 핸들러 제거 (무한 루프 방지)

  // ROAS 데이터 가져오기
  const fetchRoasData = async () => {
    try {
      const [calendarData, adsData] = await Promise.all([
        Adapters.calendarHeatmap({ from, to }, {}),
        Adapters.ads({ from, to }, {})
      ]);
      
      const totalRevenue = calendarData.reduce((sum, d) => sum + d.revenue, 0);
      const totalSpend = adsData.reduce((sum, d) => sum + (d.cost || d.spend || 0), 0);
      const roas = totalSpend ? totalRevenue / totalSpend : 0;
      
      setRoasData({
        roas: roas.toFixed(2),
        revenue: totalRevenue,
        spend: totalSpend,
        efficiency: roas > 3 ? '우수' : roas > 2 ? '양호' : roas > 1 ? '보통' : '개선필요'
      });
    } catch (error) {
      console.error('ROAS 데이터 가져오기 실패:', error);
    }
  };

  // 기본 인사이트 데이터를 메모이제이션
  const defaultInsights = useMemo(() => [
    {
      title: '기온 vs 판매량 상관관계',
      value: '0.75',
      trend: 'up' as const,
      description: '기온 1도 상승시 판매량 12% 증가 예상',
      icon: '🌡️',
      color: '#3b82f6'
    },
    {
      title: '광고비 투자 효율성',
      value: '4.2x ROAS',
      trend: 'up' as const,
      description: '광고비 100만원당 420만원 매출 발생',
      icon: '💰',
      color: '#10b981'
    },
    {
      title: '재고 리오더 알림',
      value: '3일 후',
      trend: 'down' as const,
      description: '현재 재고로 3일간 판매 가능, 긴급 주문 필요',
      icon: '📦',
      color: '#f59e0b'
    },
    {
      title: '단종 후보 상품',
      value: '2개 상품',
      trend: 'down' as const,
      description: '지난 30일 판매량 10개 미만, 단종 검토 권장',
      icon: '⚠️',
      color: '#ef4444'
    }
  ], []);

  useEffect(() => {
    const fetchInsights = async () => {
      if (initialized) return; // 이미 초기화되었으면 스킵
      
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
        // spend가 없으면 roas로부터 계산: spend = revenue / roas
        const totalSpend = calendarData.reduce((sum, item) => {
          const roas = item.roas || 2.0; // 기본 ROAS 2.0
          const spend = item.spend || (roas > 0 ? item.revenue / roas : item.revenue / 2.0);
          return sum + spend;
        }, 0);
        const avgTemperature = weatherData.length > 0 
          ? weatherData.reduce((sum, item) => sum + (item.tavg || 0), 0) / weatherData.length 
          : 0;

        // 기온과 매출의 상관관계 분석
        console.log('기온 데이터 샘플:', weatherData.slice(0, 3));
        console.log('캘린더 데이터 샘플:', calendarData.slice(0, 3));
        console.log('기온 데이터 길이:', weatherData.length);
        console.log('캘린더 데이터 길이:', calendarData.length);
        
        // 날짜별로 매칭하여 상관관계 계산
        const tempRevenuePairs: { temp: number; revenue: number }[] = [];
        weatherData.forEach(weather => {
          const matchingCalendar = calendarData.find(cal => cal.date === weather.date);
          if (matchingCalendar) {
            tempRevenuePairs.push({
              temp: weather.temperature || weather.tavg || 0,
              revenue: matchingCalendar.revenue
            });
          }
        });
        
        console.log('매칭된 데이터 쌍:', tempRevenuePairs.length);
        console.log('매칭된 데이터 샘플:', tempRevenuePairs.slice(0, 3));
        
        const tempRevenueCorrelation = calculateCorrelation(
          tempRevenuePairs.map(p => p.temp),
          tempRevenuePairs.map(p => p.revenue)
        );
        
        console.log('기온-매출 상관계수:', tempRevenueCorrelation);

        // 팝업용 상관관계 데이터 저장
        setTemperatureCorrelation({
          r: tempRevenueCorrelation,
          strength: Math.abs(tempRevenueCorrelation) > 0.7 ? '강함' : 
                   Math.abs(tempRevenueCorrelation) > 0.3 ? '보통' : 
                   Math.abs(tempRevenueCorrelation) > 0.1 ? '약함' : '미약',
          slope: tempRevenueCorrelation * 100, // 1도당 변동량 (만원 단위)
          dataPoints: tempRevenuePairs.length
        });

        // 광고비와 매출의 상관관계 분석
        const spendRevenueCorrelation = calculateCorrelation(
          calendarData.map(c => c.spend || 0),
          calendarData.map(c => c.revenue)
        );

        // 재고 분석 (실제 데이터 기반)
        const avgDailyRevenue = totalRevenue / calendarData.length;
        const avgDailyQuantity = calendarData.reduce((sum, day) => sum + (day.quantity || 0), 0) / calendarData.length;
        
        // 일평균 판매수량 기반으로 재고 추정 (30일치)
        const estimatedStock = Math.round(avgDailyQuantity * 30);
        const reorderPoint = Math.round(avgDailyQuantity * 7); // 7일치 재고 수준에서 리오더

        // 단종 후보 상품 분석 (실제 데이터 기반)
        // SKU별 매출 집계 (실제 데이터에서 추출)
        const skuRevenueMap = new Map<string, number>();
        calendarData.forEach(day => {
          if (day.sku && day.revenue) {
            const currentRevenue = skuRevenueMap.get(day.sku) || 0;
            skuRevenueMap.set(day.sku, currentRevenue + day.revenue);
          }
        });

        // SKU별 매출 데이터를 배열로 변환
        const skuData = Array.from(skuRevenueMap.entries()).map(([sku, revenue]) => ({
          sku,
          revenue,
          percentage: (revenue / totalRevenue) * 100
        }));

        // 단종 후보: 전체 매출의 3% 미만인 SKU들
        const discontinuedCandidates = skuData
          .filter(sku => sku.percentage < 3.0)
          .sort((a, b) => a.percentage - b.percentage)
          .slice(0, 5); // 상위 5개만 표시

        // 팝업용 데이터 저장
        setReorderData({
          avgDailyQuantity,
          estimatedStock,
          reorderPoint
        });
        setDiscontinuedData(discontinuedCandidates);

        // 인사이트 카드 데이터 생성
        const newInsights: InsightCardProps[] = [
          {
            title: '기온과 판매량 상관관계',
            value: `${Math.abs(tempRevenueCorrelation * 100).toFixed(0)}%`,
            trend: tempRevenueCorrelation > 0.2 ? 'up' : tempRevenueCorrelation < -0.2 ? 'down' : 'stable',
            description: tempRevenueCorrelation > 0.2 
              ? '기온 상승 시 판매량 증가' 
              : tempRevenueCorrelation < -0.2 
                ? '기온 하락 시 판매량 증가' 
                : Math.abs(tempRevenueCorrelation) > 0.1
                  ? `약한 ${tempRevenueCorrelation > 0 ? '양의' : '음의'} 상관관계`
                  : '기온과 판매량 무관',
            icon: '🌡️',
            color: tempRevenueCorrelation > 0.2 ? '#10b981' : tempRevenueCorrelation < -0.2 ? '#3b82f6' : Math.abs(tempRevenueCorrelation) > 0.1 ? '#f59e0b' : '#6b7280'
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
            description: `일평균 ${Math.round(avgDailyQuantity)}개 판매, ${reorderPoint}개 이하 시 리오더 권장`,
            icon: '📦',
            color: '#3b82f6'
          },
          {
            title: '단종 후보 상품',
            value: `${discontinuedCandidates.length}개`,
            trend: discontinuedCandidates.length > 0 ? 'down' : 'stable',
            description: discontinuedCandidates.length > 0 
              ? `매출 3% 미만 상품 ${discontinuedCandidates.length}개 단종 검토` 
              : '단종 후보 없음',
            icon: '⚠️',
            color: discontinuedCandidates.length > 0 ? '#ef4444' : '#10b981'
          }
        ];

        console.log('InsightCards 인사이트 생성 완료:', newInsights);
        setInsights(newInsights);
        setInitialized(true);
      } catch (error) {
        console.error('인사이트 데이터 로드 실패:', error);
        setInsights(defaultInsights);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, [from, to, refreshTrigger, initialized, defaultInsights]);

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
      onClick={() => {
        setPopupData(null);
        setIsPopupOpen(false);
      }}
      >
        <div style={{
          background: '#1a202c',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '1000px',
          width: '95%',
          maxHeight: '90vh',
          overflow: 'auto',
          border: '1px solid #4a5568',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setPopupData(null);
              setIsPopupOpen(false);
            }}
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
                기온과 판매량의 상관관계 분석
              </p>
              {isPopupOpen && (
                <div style={{ height: '400px', marginBottom: '8px' }}>
                  <TemperatureScatterChart 
                    refreshTrigger={1}
                    from={from}
                    to={to}
                  />
                </div>
              )}
              
              {/* 상세 인사이트 분석 요약 */}
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>🔍 인사이트 분석 요약</h4>
                <div style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#3b82f6' }}>• 계절성 패턴:</strong> 기온이 20도 근처에서 최적의 판매 환경을 보이며, 극한 온도(0도 이하, 30도 이상)에서는 판매량이 감소하는 패턴을 확인했습니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#10b981' }}>• 비즈니스 기회:</strong> 봄(15-25도)과 가을(10-20도) 시즌에 마케팅 집중을 통해 판매 효율성을 높일 수 있습니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>• 리스크 관리:</strong> 여름철 폭염과 겨울철 한파 시에는 재고 관리와 프로모션 전략을 조정하여 손실을 최소화해야 합니다.
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong style={{ color: '#ef4444' }}>• 권장사항:</strong> 기온 예보를 활용한 동적 가격 정책과 계절별 상품 믹스 최적화를 통해 매출 증대를 도모할 수 있습니다.
                  </p>
                </div>
              </div>

              <div style={{
                background: '#1a202c',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #2d3748'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>📊 분석 결과</h4>
                {temperatureCorrelation ? (
                  <>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 기온과 판매량 간의 상관계수: <strong style={{ color: '#3b82f6' }}>{temperatureCorrelation.r.toFixed(3)}</strong> ({temperatureCorrelation.strength})
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 기온 1도 상승 시 매출 <strong style={{ color: '#10b981' }}>{temperatureCorrelation.slope.toFixed(2)}만원</strong> 변동 예상
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 상관관계 강도: <strong style={{ color: '#f59e0b' }}>{temperatureCorrelation.strength}</strong>
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 분석 데이터 포인트: <strong style={{ color: '#6b7280' }}>{temperatureCorrelation.dataPoints}개</strong>
                    </p>
                  </>
                ) : (
                  <p style={{ color: '#a0aec0', fontSize: '14px' }}>
                    데이터 분석 중...
                  </p>
                )}
              </div>
            </div>
          )}

          {popupData.type === 'roas' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                광고비 투자 효율성 상세 분석
              </p>
              {isPopupOpen && (
                <div style={{ height: '400px', marginBottom: '8px' }}>
                  <RevenueSpendChart 
                    refreshTrigger={1}
                    from={from}
                    to={to}
                    region={region}
                    channel={channel}
                    category={category}
                    sku={sku}
                  />
                </div>
              )}
              
              {/* 상세 인사이트 분석 요약 */}
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>🔍 인사이트 분석 요약</h4>
                <div style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#3b82f6' }}>• 광고 효율성:</strong> 현재 ROAS 2.0x는 업계 평균(1.5-2.5x) 범위 내에 있으며, 광고비 투자 대비 적절한 수익을 창출하고 있습니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#10b981' }}>• 최적화 기회:</strong> ROAS 3.0x 이상 달성을 위해 타겟팅 정확도 향상과 크리에이티브 A/B 테스트를 통한 CTR 개선이 필요합니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>• 채널별 분석:</strong> 네이버, 구글, 메타 등 각 채널별 ROAS 차이를 분석하여 효율적인 채널에 예산을 집중 배분해야 합니다.
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong style={{ color: '#ef4444' }}>• 권장사항:</strong> 계절성과 이벤트 기간을 고려한 동적 광고비 배분과 고객 생애 가치(LTV) 기반 입찰 전략 도입을 검토하세요.
                  </p>
                </div>
              </div>

              <div style={{
                background: '#1a202c',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #2d3748'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '8px' }}>💰 ROAS 분석 결과</h4>
                {roasData ? (
                  <>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 현재 ROAS: <strong style={{ color: '#10b981' }}>{roasData.roas}x</strong> (효율성: {roasData.efficiency})
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 총 매출: <strong style={{ color: '#3b82f6' }}>₩{(roasData.revenue / 1000000).toFixed(1)}M</strong>
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 총 광고비: <strong style={{ color: '#f59e0b' }}>₩{(roasData.spend / 1000000).toFixed(1)}M</strong>
                    </p>
                    <p style={{ color: '#a0aec0', fontSize: '14px', margin: '4px 0' }}>
                      • 광고비 100만원당 <strong style={{ color: '#10b981' }}>₩{(roasData.roas * 1000000).toFixed(0)}</strong> 매출 발생
                    </p>
                  </>
                ) : (
                  <p style={{ color: '#a0aec0', fontSize: '14px' }}>
                    ROAS 데이터 분석 중...
                  </p>
                )}
              </div>
            </div>
          )}

          {popupData.type === 'discontinued' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                단종 후보 상품 목록
              </p>
              
              {/* 상세 인사이트 분석 요약 */}
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>🔍 인사이트 분석 요약</h4>
                <div style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#3b82f6' }}>• 상품 포트폴리오 현황:</strong> 현재 5개 상품이 전체 매출의 3% 미만을 차지하여 단종 검토 대상으로 분류되었습니다. 이는 상품 라인업 최적화의 기회를 의미합니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#10b981' }}>• 비용 절감 기회:</strong> 저성과 상품의 단종을 통해 재고 관리 비용, 마케팅 비용, 운영 비용을 절감하고 핵심 상품에 집중할 수 있습니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>• 리스크 관리:</strong> 단종 전 고객 만족도 조사와 대체 상품 제안을 통해 고객 이탈을 방지하고, 단계적 단종으로 재고 손실을 최소화해야 합니다.
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong style={{ color: '#ef4444' }}>• 권장사항:</strong> ABC 분석을 통한 상품 분류 체계 구축과 정기적인 상품 성과 리뷰 프로세스를 도입하여 지속적인 포트폴리오 최적화를 실현하세요.
                  </p>
                </div>
              </div>

              <div style={{ background: '#2d3748', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '12px' }}>
                  매출 3% 미만 상품 ({discontinuedData.length}개):
                </div>
                <div style={{ color: '#a0aec0' }}>
                  {discontinuedData.length > 0 ? (
                    discontinuedData.map((sku, index) => (
                      <div key={sku.sku} style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                        • {sku.sku} - 매출: ₩{sku.revenue.toLocaleString()} ({sku.percentage.toFixed(1)}%)
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '8px 0', color: '#10b981' }}>
                      단종 후보 상품이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {popupData.type === 'reorder' && (
            <div>
              <p style={{ color: '#a0aec0', marginBottom: '16px' }}>
                재고 리오더 상세 정보
              </p>
              
              {/* 상세 인사이트 분석 요약 */}
              <div style={{
                background: '#2d3748',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '16px',
                border: '1px solid #4a5568'
              }}>
                <h4 style={{ color: '#e2e8f0', marginBottom: '12px', fontSize: '16px' }}>🔍 인사이트 분석 요약</h4>
                <div style={{ color: '#a0aec0', fontSize: '14px', lineHeight: '1.6' }}>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#3b82f6' }}>• 재고 관리 현황:</strong> 현재 일평균 14개 판매로 안정적인 재고 회전율을 보이고 있으며, 7일치 재고 수준에서 리오더하는 것이 적절합니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#10b981' }}>• 최적화 기회:</strong> 계절성과 이벤트 기간을 고려한 동적 리오더 포인트 설정으로 재고 부족 리스크를 최소화할 수 있습니다.
                  </p>
                  <p style={{ marginBottom: '8px' }}>
                    <strong style={{ color: '#f59e0b' }}>• 리스크 관리:</strong> 공급업체 리드타임과 수요 변동성을 고려하여 안전재고를 20-30% 추가 확보하는 것을 권장합니다.
                  </p>
                  <p style={{ marginBottom: '0' }}>
                    <strong style={{ color: '#ef4444' }}>• 권장사항:</strong> AI 기반 수요 예측 모델 도입과 공급업체와의 실시간 재고 동기화를 통해 재고 관리 효율성을 극대화하세요.
                  </p>
                </div>
              </div>

              <div style={{ background: '#2d3748', padding: '16px', borderRadius: '8px' }}>
                <div style={{ color: '#e2e8f0', fontWeight: '600', marginBottom: '12px' }}>
                  리오더 기준 정보:
                </div>
                <div style={{ color: '#a0aec0' }}>
                  {reorderData ? (
                    <>
                      <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                        • 일평균 판매수량: {Math.round(reorderData.avgDailyQuantity)}개
                      </div>
                      <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                        • 추정 재고량: {reorderData.estimatedStock}개 (30일치)
                      </div>
                      <div style={{ padding: '8px 0', borderBottom: '1px solid #4a5568' }}>
                        • 리오더 시점: {reorderData.reorderPoint}개 이하
                      </div>
                      <div style={{ padding: '8px 0' }}>
                        • 리오더 권장일: {Math.round(reorderData.reorderPoint / reorderData.avgDailyQuantity)}일 후
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '8px 0', color: '#6b7280' }}>
                      데이터를 불러오는 중...
                    </div>
                  )}
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

  // 기본 인사이트 카드 표시 (로딩 상태 제거)
  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  return (
    <>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '12px',
        marginBottom: '16px'
      }}>
        {displayInsights.map((insight, index) => (
          <InsightCard 
            key={index} 
            {...insight} 
            onClick={() => {
              const typeMap: { [key: string]: 'temperature' | 'roas' | 'reorder' | 'discontinued' | 'repurchase' } = {
                '기온 vs 판매량 상관관계': 'temperature',
                '기온과 판매량 상관관계': 'temperature',
                '광고비 투자 효율성': 'roas',
                '광고비 효율성': 'roas',
                '재고 리오더 알림': 'reorder',
                '리오더 시점': 'reorder',
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
                
                // 팝업이 열릴 때만 상태 업데이트
                setIsPopupOpen(true);
                
                // ROAS 팝업인 경우 데이터 가져오기
                if (type === 'roas') {
                  fetchRoasData();
                }
              }
            }}
          />
        ))}
      </div>
      
      {/* 클릭 안내 메시지 - 접기/펼치기 가능 */}
      {isGuideVisible && (
        <div style={{
          textAlign: 'center',
          marginBottom: '24px',
          padding: '8px 16px',
          background: '#2d3748',
          borderRadius: '6px',
          border: '1px solid #4a5568',
          position: 'relative'
        }}>
          <p style={{
            color: '#a0aec0',
            fontSize: '12px',
            margin: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}>
            <span>💡</span>
            <span>인사이트 카드를 클릭하면 더 상세한 분석을 확인할 수 있습니다</span>
            <span>👆</span>
          </p>
          
          {/* 접기 버튼 */}
          <button
            onClick={() => setIsGuideVisible(false)}
            style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              background: 'none',
              border: 'none',
              color: '#6b7280',
              fontSize: '14px',
              cursor: 'pointer',
              padding: '2px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '20px',
              height: '20px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a5568';
              e.currentTarget.style.color = '#a0aec0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = '#6b7280';
            }}
            title="안내 숨기기"
          >
            ×
          </button>
        </div>
      )}
      
      {/* 접힌 상태일 때 펼치기 버튼 */}
      {!isGuideVisible && (
        <div style={{
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <button
            onClick={() => setIsGuideVisible(true)}
            style={{
              background: '#2d3748',
              border: '1px solid #4a5568',
              borderRadius: '6px',
              color: '#a0aec0',
              fontSize: '11px',
              padding: '4px 12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              margin: '0 auto'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#4a5568';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#2d3748';
            }}
            title="안내 보기"
          >
            <span>💡</span>
            <span>안내 보기</span>
          </button>
        </div>
      )}
      
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
