'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';
import { GridLayout, GridItem } from '../../../components/dashboard/GridLayout';
import { useFilters } from '../../../hooks/useFilters';

// Dynamic imports for better performance
const AIQueryInterface = dynamic(() => import('../../../components/ai/AIQueryInterface'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>AI 인터페이스 로딩 중...</div>
});

const AIResultsDisplay = dynamic(() => import('../../../components/ai/AIResultsDisplay'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>결과 표시 로딩 중...</div>
});

const AIEvidencePanel = dynamic(() => import('../../../components/ai/AIEvidencePanel'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>증거 패널 로딩 중...</div>
});

const AIActionQueue = dynamic(() => import('../../../components/ai/AIActionQueue'), {
  loading: () => <div style={{ padding: '20px', textAlign: 'center' }}>액션 큐 로딩 중...</div>
});

export default function AIAnalysisPage() {
  const { filters, setFrom, setTo, setRegion, setChannel, setCategory, setSku, resetFilters } = useFilters();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any>(null);
  const [evidence, setEvidence] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAIQuery = async (queryText: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: queryText,
          filters: {
            from: filters.from,
            to: filters.to,
            region: filters.region,
            channel: filters.channel,
            category: filters.category,
            sku: filters.sku
          }
        })
      });
      
      const data = await response.json();
      setResults(data);
      setEvidence(data.evidence);
    } catch (error) {
      console.error('AI 쿼리 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filtersComponent = (
    <div>
      <label className="muted">기간</label>
      <div className="row" style={{ margin: '8px 0' }}>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFrom(e.target.value)}
          style={{ marginRight: '8px' }}
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      <label className="muted">지역</label>
      <select 
        multiple 
        value={filters.region}
        onChange={(e) => setRegion(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="SEOUL">서울</option>
        <option value="BUSAN">부산</option>
        <option value="DAEGU">대구</option>
        <option value="INCHEON">인천</option>
        <option value="GWANGJU">광주</option>
        <option value="DAEJEON">대전</option>
        <option value="ULSAN">울산</option>
      </select>

      <label className="muted">채널</label>
      <select 
        multiple 
        value={filters.channel}
        onChange={(e) => setChannel(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="naver">네이버</option>
        <option value="coupang">쿠팡</option>
        <option value="google">구글</option>
        <option value="meta">메타</option>
      </select>

      <label className="muted">카테고리</label>
      <select 
        multiple 
        value={filters.category}
        onChange={(e) => setCategory(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS">상의</option>
        <option value="BOTTOMS">하의</option>
        <option value="SHOES">신발</option>
        <option value="BAGS">가방</option>
        <option value="ACCESSORIES">액세서리</option>
      </select>

      <label className="muted">SKU</label>
      <select 
        multiple 
        value={filters.sku}
        onChange={(e) => setSku(Array.from(e.target.selectedOptions, option => option.value))}
        style={{ marginBottom: '8px' }}
      >
        <option value="TOPS-001">TOPS-001</option>
        <option value="BOTTOMS-001">BOTTOMS-001</option>
        <option value="SHOES-001">SHOES-001</option>
        <option value="BAGS-001">BAGS-001</option>
      </select>
    </div>
  );

  const actionsComponent = (
    <div>
      <button 
        className="btn" 
        onClick={handleRefresh}
        style={{ 
          backgroundColor: '#3b82f6', 
          color: 'white',
          width: '100%',
          marginBottom: '8px'
        }}
      >
        🔄 데이터 새로고침
      </button>
      
      <button 
        className="btn" 
        onClick={resetFilters}
        style={{ 
          backgroundColor: '#6b7280', 
          color: 'white',
          width: '100%'
        }}
      >
        초기화
      </button>
    </div>
  );

  return (
    <DashboardLayout
      title="AI 분석"
      subtitle="v2 (통합 대시보드)"
      filters={filtersComponent}
      actions={actionsComponent}
    >
      <GridLayout page="ai">
        {/* 좌측: AI 쿼리 인터페이스 */}
        <GridItem id="query">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🤖 AI 질문</h3>
          <AIQueryInterface 
            onQuery={handleAIQuery}
            isLoading={isLoading}
            filters={filters}
          />
        </GridItem>

        {/* 중앙: 결과 표시 */}
        <GridItem id="results">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>📊 분석 결과</h3>
          <AIResultsDisplay 
            results={results}
            isLoading={isLoading}
          />
        </GridItem>

        {/* 우측: 증거 패널 */}
        <GridItem id="evidence">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>🔍 증거</h3>
          <AIEvidencePanel 
            evidence={evidence}
          />
        </GridItem>

        {/* 하단: 액션 큐 */}
        <GridItem id="actions">
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>⚡ 액션 큐</h3>
          <AIActionQueue 
            results={results}
          />
        </GridItem>
      </GridLayout>
    </DashboardLayout>
  );
}
