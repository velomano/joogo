'use client';

import React from 'react';
import { DashboardLayout } from '../../../components/dashboard/DashboardLayout';

export default function HelpPage() {
  return (
    <DashboardLayout
      title="사이트 도움말"
      subtitle="v2 (통합 대시보드)"
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2 style={{ marginBottom: '24px', color: '#1f2937' }}>📚 사용자 가이드</h2>
        
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#374151' }}>🎯 기능별 사용법</h3>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>📈 판매 분석</h4>
              <p style={{ marginBottom: '8px', color: '#6b7280' }}>
                매출, 주문, ROAS 등 판매 성과를 종합적으로 분석합니다.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>KPI 오버뷰: 주요 지표 한눈에 보기</li>
                <li>일별 추이: 매출/주문/광고비 트렌드</li>
                <li>캘린더 히트맵: 일별 매출 패턴</li>
                <li>채널/지역 성과: 채널별, 지역별 분석</li>
                <li>파레토 분석: 80-20 법칙 적용</li>
                <li>가격 탄력성: 가격 변화에 따른 수요 반응</li>
                <li>이상치 탐지: 비정상적인 패턴 감지</li>
              </ul>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>📦 재고 분석</h4>
              <p style={{ marginBottom: '8px', color: '#6b7280' }}>
                재고 최적화를 위한 품절 위험, 과잉 재고, 재주문 제안을 제공합니다.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>재고 KPI: 총 재고가치, 가용재고, 회전율</li>
                <li>품절 위험: 7일 내 품절 예상 SKU</li>
                <li>과잉 재고: 90일 이상 재고 보유 SKU</li>
                <li>ABC 분석: 재고 가치 기준 상품 분류</li>
                <li>재고 노화: 오래된 재고 관리</li>
                <li>재주문 제안: 최적 주문량 계산</li>
                <li>창고 운영: 입출고 효율성 분석</li>
              </ul>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <h4 style={{ marginBottom: '8px', color: '#1f2937' }}>🤖 AI 분석</h4>
              <p style={{ marginBottom: '8px', color: '#6b7280' }}>
                자연어 질문으로 데이터를 분석하고 인사이트를 제공합니다.
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#6b7280' }}>
                <li>자연어 질문: "상위 10개 상품은?"</li>
                <li>자동 분석: 데이터 추출 → 시각화 → 인사이트</li>
                <li>증거 제공: 분석 근거와 신뢰도 표시</li>
                <li>액션 제안: 구체적인 실행 방안 제시</li>
                <li>JSON 다운로드: 분석 결과 내보내기</li>
              </ul>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#374151' }}>⌨️ 단축키</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              <code style={{ color: '#1f2937' }}>Ctrl + R</code>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>페이지 새로고침</span>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              <code style={{ color: '#1f2937' }}>Ctrl + E</code>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>데이터 내보내기</span>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              <code style={{ color: '#1f2937' }}>Ctrl + F</code>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>필터 포커스</span>
            </div>
            <div style={{ padding: '12px', backgroundColor: '#f3f4f6', borderRadius: '6px' }}>
              <code style={{ color: '#1f2937' }}>Ctrl + H</code>
              <span style={{ marginLeft: '8px', color: '#6b7280' }}>도움말 토글</span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#374151' }}>❓ 자주 묻는 질문</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <details style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#1f2937' }}>
                데이터는 언제 업데이트되나요?
              </summary>
              <p style={{ marginTop: '8px', color: '#6b7280' }}>
                실시간 데이터는 5분마다, 일별 집계 데이터는 매일 오전 2시에 업데이트됩니다.
              </p>
            </details>
            
            <details style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#1f2937' }}>
                필터는 어떻게 사용하나요?
              </summary>
              <p style={{ marginTop: '8px', color: '#6b7280' }}>
                좌측 패널에서 기간, 지역, 채널, 카테고리, SKU를 선택할 수 있습니다. 
                여러 값을 선택하려면 Ctrl 키를 누른 채 클릭하세요.
              </p>
            </details>
            
            <details style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#1f2937' }}>
                AI 분석은 어떻게 사용하나요?
              </summary>
              <p style={{ marginTop: '8px', color: '#6b7280' }}>
                AI 분석 페이지에서 자연어로 질문하세요. 예: "이번 달 상위 10개 상품은?", 
                "품절 위험이 있는 상품은?", "ROAS가 낮은 채널은?"
              </p>
            </details>
            
            <details style={{ padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '500', color: '#1f2937' }}>
                데이터를 내보낼 수 있나요?
              </summary>
              <p style={{ marginTop: '8px', color: '#6b7280' }}>
                네, Ctrl+E 단축키나 각 페이지의 내보내기 버튼을 통해 CSV/XLSX 형식으로 
                데이터를 다운로드할 수 있습니다.
              </p>
            </details>
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', color: '#374151' }}>📞 지원</h3>
          <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
            <p style={{ margin: 0, color: '#1e40af' }}>
              추가 문의사항이 있으시면 개발팀에 연락해주세요.
              <br />
              이메일: dev@joogo.com | 전화: 02-1234-5678
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
