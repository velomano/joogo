'use client';

import { useState, useCallback } from 'react';

interface ApiStatus {
  cafe24: 'idle' | 'loading' | 'success' | 'error';
  weather: 'idle' | 'loading' | 'success' | 'error';
  ads: 'idle' | 'loading' | 'success' | 'error';
}

export default function ApiTestSection() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({
    cafe24: 'idle',
    weather: 'idle',
    ads: 'idle'
  });

  const [lastUpdate, setLastUpdate] = useState<{[key: string]: string}>({});

  const testApi = useCallback(async (apiType: keyof ApiStatus) => {
    setApiStatus(prev => ({ ...prev, [apiType]: 'loading' }));
    
    try {
      let endpoint = '';
      switch (apiType) {
        case 'cafe24':
          endpoint = '/api/mock/cafe24?kind=calendar&from=2025-01-01&to=2025-01-07';
          break;
        case 'weather':
          endpoint = '/api/weather?from=2025-01-01&to=2025-01-07';
          break;
        case 'ads':
          endpoint = '/api/ads?from=2025-01-01&to=2025-01-07';
          break;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        setApiStatus(prev => ({ ...prev, [apiType]: 'success' }));
        const now = new Date();
        setLastUpdate(prev => ({ 
          ...prev, 
          [apiType]: now.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          })
        }));
        
        // API 테스트 성공 이벤트 발생
        window.dispatchEvent(new CustomEvent('apiTestSuccess', {
          detail: { apiType, timestamp: now.toISOString() }
        }));
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`${apiType} API 테스트 실패:`, error);
      setApiStatus(prev => ({ ...prev, [apiType]: 'error' }));
    }
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'loading': return '⏳';
      default: return '⚪';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success': return '정상';
      case 'error': return '오류';
      case 'loading': return '테스트중';
      default: return '미테스트';
    }
  };

  const getButtonStyle = (status: string) => {
    const baseStyle = {
      width: '100%',
      padding: '8px 12px',
      margin: '4px 0',
      border: 'none',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    };

    switch (status) {
      case 'success':
        return { ...baseStyle, backgroundColor: '#10b981', color: 'white' };
      case 'error':
        return { ...baseStyle, backgroundColor: '#ef4444', color: 'white' };
      case 'loading':
        return { ...baseStyle, backgroundColor: '#f59e0b', color: 'white' };
      default:
        return { ...baseStyle, backgroundColor: '#6b7280', color: 'white' };
    }
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="muted" style={{ marginBottom: '8px', fontSize: '13px', fontWeight: '600' }}>
        🔌 API 관리
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button
          onClick={() => testApi('cafe24')}
          disabled={apiStatus.cafe24 === 'loading'}
          style={getButtonStyle(apiStatus.cafe24)}
        >
          <span>쇼핑몰 API</span>
          <span style={{ fontSize: '10px' }}>
            {getStatusIcon(apiStatus.cafe24)} {getStatusText(apiStatus.cafe24)}
          </span>
        </button>
        
        <button
          onClick={() => testApi('weather')}
          disabled={apiStatus.weather === 'loading'}
          style={getButtonStyle(apiStatus.weather)}
        >
          <span>기상청 API</span>
          <span style={{ fontSize: '10px' }}>
            {getStatusIcon(apiStatus.weather)} {getStatusText(apiStatus.weather)}
          </span>
        </button>
        
        <button
          onClick={() => testApi('ads')}
          disabled={apiStatus.ads === 'loading'}
          style={getButtonStyle(apiStatus.ads)}
        >
          <span>광고비 API</span>
          <span style={{ fontSize: '10px' }}>
            {getStatusIcon(apiStatus.ads)} {getStatusText(apiStatus.ads)}
          </span>
        </button>
      </div>

      {/* 마지막 업데이트 시간 표시 */}
      {(lastUpdate.cafe24 || lastUpdate.weather || lastUpdate.ads) && (
        <div style={{ marginTop: '8px', fontSize: '10px', color: '#9ca3af' }}>
          <div style={{ marginBottom: '4px' }}>마지막 테스트:</div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {lastUpdate.cafe24 && <span>쇼핑몰: {lastUpdate.cafe24}</span>}
            {lastUpdate.weather && <span>기상청: {lastUpdate.weather}</span>}
            {lastUpdate.ads && <span>광고비: {lastUpdate.ads}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
