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
    try {
      // 모든 API를 동시에 호출
      const promises = [
        fetch('/api/mock/cafe24?kind=calendar&from=2025-01-01&to=2025-01-07'),
        fetch('/api/weather?from=2025-01-01&to=2025-01-07'),
        fetch('/api/ads?from=2025-01-01&to=2025-01-07')
      ];

      const responses = await Promise.all(promises);
      const allSuccess = responses.every(response => response.ok);
      
      if (allSuccess) {
        const now = new Date();
        setLastUpdate(now.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        }));
        
        // 데이터 불러오기 성공 이벤트 발생
        window.dispatchEvent(new CustomEvent('apiTestSuccess', {
          detail: { 
            apiType: 'all', 
            timestamp: now.toISOString(),
            success: true
          }
        }));
      } else {
        throw new Error('일부 API 호출 실패');
      }
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 컴포넌트 마운트 시 날씨 데이터 로드
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

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
