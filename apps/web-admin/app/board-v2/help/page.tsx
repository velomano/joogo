'use client';

import React, { useState } from 'react';

export default function HelpPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '개요' },
    { id: 'features', label: '기능' },
    { id: 'shortcuts', label: '단축키' },
    { id: 'troubleshooting', label: '문제해결' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div>
            <h2>Joogo 통합 대시보드 v2</h2>
            <p>판매, 재고, AI 분석을 통합한 비즈니스 인텔리전스 플랫폼입니다.</p>
            
            <h3>주요 페이지</h3>
            <ul>
              <li><strong>통합 대시보드:</strong> 전체적인 KPI와 핵심 지표를 한눈에 확인</li>
              <li><strong>판매 분석:</strong> 매출, 채널, 지역별 상세 분석</li>
              <li><strong>재고 분석:</strong> 재고 현황, 품절 위험, 재주문 제안</li>
              <li><strong>AI 분석:</strong> 자연어 질의를 통한 인사이트 도출</li>
            </ul>

            <h3>기술 스택</h3>
            <ul>
              <li>Next.js 14 App Router</li>
              <li>TypeScript</li>
              <li>Tailwind CSS</li>
              <li>Chart.js</li>
              <li>Supabase</li>
            </ul>
          </div>
        );

      case 'features':
        return (
          <div>
            <h2>주요 기능</h2>
            
            <h3>📊 통합 대시보드</h3>
            <ul>
              <li>실시간 KPI 모니터링</li>
              <li>인터랙티브 차트 및 그래프</li>
              <li>드래그 앤 드롭 레이아웃</li>
              <li>개인화된 대시보드 저장</li>
            </ul>

            <h3>📈 판매 분석</h3>
            <ul>
              <li>매출/광고비/ROAS 분석</li>
              <li>판매량과 기온 상관관계</li>
              <li>카테고리별 매출 비중</li>
              <li>지역별 성과 분석</li>
              <li>파레토/ABC 분석</li>
              <li>이벤트 임팩트 분석</li>
            </ul>

            <h3>📦 재고 분석</h3>
            <ul>
              <li>재고 KPI 오버뷰</li>
              <li>품절 위험 SKU 탐지</li>
              <li>과잉 재고 식별</li>
              <li>재고 노화 분석</li>
              <li>자동 재주문 제안</li>
            </ul>

            <h3>🤖 AI 분석</h3>
            <ul>
              <li>자연어 질의 응답</li>
              <li>데이터 기반 인사이트 생성</li>
              <li>자동 액션 제안</li>
              <li>Evidence 기반 분석</li>
            </ul>
          </div>
        );

      case 'shortcuts':
        return (
          <div>
            <h2>단축키</h2>
            
            <h3>전역 단축키</h3>
            <ul>
              <li><kbd>Ctrl + R</kbd> - 데이터 새로고침</li>
              <li><kbd>Ctrl + 1</kbd> - 통합 대시보드</li>
              <li><kbd>Ctrl + 2</kbd> - 판매 분석</li>
              <li><kbd>Ctrl + 3</kbd> - 재고 분석</li>
              <li><kbd>Ctrl + 4</kbd> - AI 분석</li>
              <li><kbd>Ctrl + H</kbd> - 도움말</li>
            </ul>

            <h3>필터 단축키</h3>
            <ul>
              <li><kbd>Ctrl + F</kbd> - 필터 패널 토글</li>
              <li><kbd>Ctrl + Shift + R</kbd> - 필터 초기화</li>
            </ul>

            <h3>차트 단축키</h3>
            <ul>
              <li><kbd>Space</kbd> - 차트 전체화면</li>
              <li><kbd>Esc</kbd> - 전체화면 해제</li>
              <li><kbd>Ctrl + S</kbd> - 차트 이미지 저장</li>
            </ul>
          </div>
        );

      case 'troubleshooting':
        return (
          <div>
            <h2>문제해결</h2>
            
            <h3>일반적인 문제</h3>
            
            <h4>Q: 데이터가 로드되지 않아요</h4>
            <p>A: 다음을 확인해보세요:</p>
            <ul>
              <li>인터넷 연결 상태</li>
              <li>브라우저 새로고침 (F5)</li>
              <li>필터 설정이 올바른지 확인</li>
              <li>데이터 새로고침 버튼 클릭</li>
            </ul>

            <h4>Q: 차트가 표시되지 않아요</h4>
            <p>A: 다음을 시도해보세요:</p>
            <ul>
              <li>브라우저 캐시 삭제</li>
              <li>다른 브라우저로 시도</li>
              <li>JavaScript가 활성화되어 있는지 확인</li>
            </ul>

            <h4>Q: AI 분석이 작동하지 않아요</h4>
            <p>A: 다음을 확인해보세요:</p>
            <ul>
              <li>프롬프트가 명확한지 확인</li>
              <li>API 키가 올바르게 설정되었는지 확인</li>
              <li>네트워크 연결 상태</li>
            </ul>

            <h3>성능 최적화</h3>
            <ul>
              <li>대용량 데이터 조회 시 필터를 사용하세요</li>
              <li>불필요한 차트는 숨기세요</li>
              <li>정기적으로 브라우저 캐시를 삭제하세요</li>
            </ul>

            <h3>지원</h3>
            <p>추가 도움이 필요하시면 개발팀에 문의하세요.</p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="wrap">
      <aside className="sidebar panel">
        <h1>도움말 <span className="muted">v2</span></h1>
        
        <div>
          <hr className="line" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="btn"
                style={{
                  backgroundColor: activeTab === tab.id ? '#3b82f6' : '#374151',
                  color: 'white',
                  textAlign: 'left',
                  padding: '8px 12px',
                  fontSize: '14px'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <main className="main">
        <section className="panel">
          <div className="chart-container">
            {renderContent()}
          </div>
        </section>
      </main>
    </div>
  );
}
