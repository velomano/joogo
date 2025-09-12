'use client';

import { useState, useCallback, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  humidity: number;
  description: string;
  location: string;
  lastUpdate: string;
}

export default function ApiTestSection() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 실제 기상청 API에서 날씨 정보 가져오기
  const fetchWeatherData = useCallback(async () => {
    try {
      // 기상청 공공데이터포털 API (실제 사용시 API 키 필요)
      // 현재는 mock 데이터로 대체
      const response = await fetch('/api/weather?from=2025-01-01&to=2025-01-07');
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setWeatherData({
            temperature: Math.round(latest.temperature || 20),
            humidity: Math.round((latest.humidity || 50) * 100),
            description: getWeatherDescription(latest.temperature || 20),
            location: '서울',
            lastUpdate: new Date().toLocaleTimeString('ko-KR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          });
        }
      }
    } catch (error) {
      console.error('날씨 데이터 가져오기 실패:', error);
    }
  }, []);

  const getWeatherDescription = (temp: number) => {
    if (temp < 0) return '눈';
    if (temp < 10) return '흐림';
    if (temp < 20) return '구름많음';
    if (temp < 30) return '맑음';
    return '맑음';
  };

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    setMessage(null); // 이전 메시지 초기화
    
    try {
      // 현재 시간을 쿼리 파라미터로 추가하여 캐시 방지
      const timestamp = Date.now();
      const tenantId = '84949b3c-2cb7-4c42-b9f9-d1f37d371e00'; // 기본 테넌트 ID
      const apiCalls = [
        { name: '매출 데이터', url: `/api/board/charts?tenant_id=${tenantId}&from=2025-01-01&to=2025-01-07&_t=${timestamp}` },
        { name: '날씨 데이터', url: `/api/data/weather?from=2025-01-01&to=2025-01-07&region=SEOUL&_t=${timestamp}` },
        { name: '광고 데이터', url: `/api/data/ads?from=2025-01-01&to=2025-01-07&_t=${timestamp}` }
      ];

      const results = await Promise.allSettled(
        apiCalls.map(api => fetch(api.url))
      );

      const now = new Date();
      setLastUpdate(now.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      }));

      // 결과 분석
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.ok
      ).length;
      
      const failedCount = results.length - successCount;
      
      // 각 API별 상세 결과 수집
      const details = [];
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const apiName = apiCalls[i].name;
        
        if (result.status === 'fulfilled' && result.value.ok) {
          try {
            const data = await result.value.json();
            const count = Array.isArray(data) ? data.length : 1;
            
            // 헤더에서 실제 API 상태 확인
            const apiStatus = result.value.headers.get('X-API-Status');
            if (apiStatus === 'fallback') {
              details.push(`${apiName}: ${count}개 (Fallback)`);
            } else {
              details.push(`${apiName}: ${count}개`);
            }
          } catch {
            details.push(`${apiName}: 성공`);
          }
        } else {
          details.push(`${apiName}: 실패`);
        }
      }

      if (successCount === results.length) {
        // 모든 API 성공
        setMessage({ 
          type: 'success', 
          text: `✅ 모든 데이터를 성공적으로 불러왔습니다!\n${details.join(', ')}` 
        });
      } else if (successCount > 0) {
        // 일부 성공
        setMessage({ 
          type: 'success', 
          text: `⚠️ ${successCount}/${results.length}개 API 성공\n${details.join(', ')}` 
        });
      } else {
        // 모든 API 실패
        setMessage({ 
          type: 'error', 
          text: `❌ 모든 API 호출 실패\n${details.join(', ')}` 
        });
      }
      
      // 데이터 불러오기 이벤트 발생
      window.dispatchEvent(new CustomEvent('apiTestSuccess', {
        detail: { 
          apiType: 'all', 
          timestamp: now.toISOString(),
          success: successCount > 0,
          successCount,
          totalCount: results.length,
          details
        }
      }));
      
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
      setMessage({ type: 'error', text: '❌ 데이터 불러오기에 실패했습니다. 다시 시도해주세요.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 날씨 데이터 로드
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // 메시지 자동 사라지기
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000); // 5초로 연장
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="muted" style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
        🔌 데이터 관리
      </div>
      
      {/* 실시간 날씨 정보 */}
      {weatherData && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '8px', 
          backgroundColor: '#1e293b', 
          borderRadius: '6px',
          border: '1px solid #334155'
        }}>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
            🌤️ 현재 날씨 ({weatherData.location})
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#f1f5f9' }}>
                {weatherData.temperature}°C
              </span>
              <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '4px' }}>
                {weatherData.description}
              </span>
            </div>
            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
              습도 {weatherData.humidity}%
            </div>
          </div>
          <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
            업데이트: {weatherData.lastUpdate}
          </div>
        </div>
      )}
      
      {/* 메시지 표시 (버튼 위) */}
      {message && (
        <div style={{
          marginBottom: '8px',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '500',
          textAlign: 'center',
          backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444',
          color: 'white',
          animation: 'fadeInOut 5s ease-in-out',
          whiteSpace: 'pre-line',
          lineHeight: '1.4'
        }}>
          {message.text}
        </div>
      )}
      
      {/* 통합 데이터 불러오기 버튼 */}
      <button
        onClick={loadAllData}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '10px 12px',
          margin: '4px 0',
          border: 'none',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: '600',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          backgroundColor: isLoading ? '#f59e0b' : '#3b82f6',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}
      >
        {isLoading ? '⏳' : '🔄'} 
        {isLoading ? '데이터 불러오는 중...' : '데이터 불러오기'}
      </button>

      {/* 마지막 업데이트 시간 */}
      {lastUpdate && (
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af', textAlign: 'center' }}>
          마지막 불러오기: {lastUpdate}
        </div>
      )}
    </div>
  );
}
