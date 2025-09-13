'use client';

import React, { useState } from 'react';

export default function AIAnalysisPage() {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      // TODO: AI API 연동
      await new Promise(resolve => setTimeout(resolve, 2000)); // 임시 딜레이
      setResult({
        type: 'success',
        data: 'AI 분석 결과가 여기에 표시됩니다.',
        insights: ['인사이트 1', '인사이트 2', '인사이트 3'],
        actions: ['액션 1', '액션 2', '액션 3']
      });
    } catch (error) {
      setResult({
        type: 'error',
        message: 'AI 분석 중 오류가 발생했습니다.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filtersComponent = (
    <div>
      <hr className="line" />
      <label className="muted">AI 프롬프트</label>
      <form onSubmit={handleSubmit}>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="분석하고 싶은 내용을 입력하세요..."
          style={{
            width: '100%',
            height: '120px',
            padding: '8px',
            marginBottom: '8px',
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '4px',
            color: 'white',
            resize: 'vertical'
          }}
        />
        <button 
          type="submit"
          className="btn" 
          disabled={isLoading || !prompt.trim()}
          style={{ 
            backgroundColor: '#3b82f6', 
            color: 'white',
            width: '100%',
            marginBottom: '8px'
          }}
        >
          {isLoading ? '분석 중...' : '🤖 AI 분석 시작'}
        </button>
      </form>

      <label className="muted">빠른 질문</label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <button 
          className="btn" 
          onClick={() => setPrompt('상위 SKU 10개를 보여줘')}
          style={{ 
            backgroundColor: '#374151', 
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }}
        >
          상위 SKU 10개
        </button>
        <button 
          className="btn" 
          onClick={() => setPrompt('재고 위험 SKU를 찾아줘')}
          style={{ 
            backgroundColor: '#374151', 
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }}
        >
          재고 위험 SKU
        </button>
        <button 
          className="btn" 
          onClick={() => setPrompt('캠페인 A/B 테스트 결과를 분석해줘')}
          style={{ 
            backgroundColor: '#374151', 
            color: 'white',
            fontSize: '12px',
            padding: '4px 8px'
          }}
        >
          캠페인 A/B 테스트
        </button>
      </div>
    </div>
  );

  return (
    <div className="wrap">
      <aside className="sidebar panel">
        <h1>AI 분석 <span className="muted">v2</span></h1>
        
        {filtersComponent}
      </aside>

      <main className="main">
        <section className="panel">
          <div style={{ display: 'grid', gap: '20px' }}>
            {/* AI 분석 결과 */}
            <div className="chart-container">
              <h3>🤖 AI 분석 결과</h3>
              {result ? (
                <div style={{ padding: '20px' }}>
                  {result.type === 'success' ? (
                    <div>
                      <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#1f2937', borderRadius: '4px' }}>
                        <strong>분석 결과:</strong>
                        <p style={{ margin: '8px 0 0 0' }}>{result.data}</p>
                      </div>
                      
                      <div style={{ marginBottom: '16px' }}>
                        <strong>인사이트:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {result.insights?.map((insight, index) => (
                            <li key={index}>{insight}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <strong>권장 액션:</strong>
                        <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                          {result.actions?.map((action, index) => (
                            <li key={index}>{action}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '12px', backgroundColor: '#7f1d1d', borderRadius: '4px', color: '#fca5a5' }}>
                      <strong>오류:</strong> {result.message}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  AI 분석을 시작하려면 왼쪽에서 프롬프트를 입력하세요.
                </div>
              )}
            </div>

            {/* Evidence 카드 */}
            <div className="chart-container">
              <h3>📋 Evidence 카드</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                RPC 호출, 행수, 기간, 신뢰도 정보 (구현 예정)
              </div>
            </div>

            {/* 액션큐 */}
            <div className="chart-container">
              <h3>⚡ 액션큐</h3>
              <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                생성된 액션들을 큐에 추가 (구현 예정)
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
