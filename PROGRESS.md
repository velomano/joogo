# 📑 프로젝트 기획 및 진행 현황 보고서

## 1. 현재까지 완료된 작업
- **CSV 업로드 → DB 저장 → 조회 기능 완성**
  - CSV 파일 업로드 시스템을 web-admin과 ingest-worker에 완전 통합
  - 65개 상품 데이터 성공적으로 업로드 및 적재 확인
  - `original_data`에 JSONB 형태로 원본 데이터를 보존해 유연성 확보
  - 스키마 충돌 문제를 해결하여 안정적인 데이터 적재 파이프라인 구축

- **Git 워크플로우 정리**
  - main 브랜치를 새롭게 정리 (불필요한 히스토리 제거)
  - 여러 PC(맥/윈도우)에서 동일하게 사용할 수 있는 Git 루틴 확립
  - 시작 전(main 최신화) → 작업(feat/* 브랜치) → 작업 끝(main 병합) → 브랜치 정리 패턴을 표준화

- **UI/UX 개선**
  - 재고 목록 컬럼 순서 최적화
  - 상세보기 기능 구현
  - 데이터 초기화 및 새로고침 기능 추가

## 2. 새롭게 확정된 기획 방향
- **데이터 분석 중심 SaaS 구조**
  - 단순 WMS/OMS 기능에서 확장 → “판매 분석 및 인사이트 제공”에 집중
  - CSV 업로드 → DB 정규화 → 분석 → AI 질의 → 액션큐 실행이라는 단계적 구조 확립
- **멀티테넌시 강화**
  - 모든 데이터에 `tenant_id` 포함 및 RLS 정책 적용
  - 테넌트별 데이터 분리 및 안전한 질의 실행 구조
- **UI/UX 개선 기조**
  - 대시보드 첫 섹션은 항상 “Action Queue”로 고정
  - KRW 포맷, 날짜 필터, SKU 멀티선택, CSV 내보내기 지원
  - “AI 질의 결과 → 액션으로 보내기” 기능 강화

## 3. 앞으로의 작업 (로드맵)

### Phase 1: 데이터 구조 최적화 (1~2주)
- `analytics.stage_sales`, `analytics.fact_sales` 테이블 확정
- PK/인덱스 및 `row_num`, `file_id` 컬럼 포함
- COPY 기반 적재 및 기본 검증 함수 추가
- RLS 정책 적용 (tenant_id 기반)

### Phase 2: 분석 엔진 구축 (2~3주)
- `mv_sales_monthly`, `mv_top_sku` 머티리얼라이즈드 뷰 구현
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` 적용
- 증분 리프레시 함수 작성

### Phase 3: AI 질의 고도화 (3~4주)
- 질의 의도 라우터 스켈레톤 작성
- AI SQL 템플릿 10개 초안 작성 (월별 매출, Top-N SKU, 전월 대비 등)
- 안전장치: SELECT 화이트리스트, LIMIT 기본값, 캐시 키(`tenant_id + intent + params`)

### Phase 4: 액션큐 시스템 (2~3주)
- `ActionQueue` 테이블 설계  
  (id, tenant_id, type, status, payload JSONB, created_at, updated_at)
- 상태머신: Draft → Proposed → Approved → Executed (+Cancelled/Failed)
- AI 질의 결과를 액션으로 전송하는 기능 구현

## 4. 최종 목표
- CSV 업로드 기반으로 시작했지만, 점차 **“AI 인사이트 + 액션큐 SaaS”**로 발전  
- 판매 분석, 재고 예측, 재주문 제안, 이벤트/캠페인 기획까지 지원  
- 관리자 입장에서는 “업로드 → 분석 → 인사이트 → 액션”이 한눈에 보이는 흐름 완성
