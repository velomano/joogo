# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and this project adheres to Semantic Versioning.

## [0.1.3] - 2025-08-21
### Added
- **Sales Analytics Dashboard 고도화**: KRW 통화 포맷, 날짜 범위 필터, SKU 다중선택 필터
- **차트 시각화**: 월별 매출 추이(LineChart), Top SKU 일별 매출(BarChart), 요약 카드(총매출/전월대비/평균단가)
- **CSV 다운로드**: 월별 집계, Top SKU, 최근 거래 데이터 각각 CSV 다운로드 기능
- **Natural Language Query 확장**: 5개 이상의 의도 분류(`top_sku_days`, `monthly_summary`, `annual_total`, `mom_change`, `sku_trend`)
- **Safe SQL Guard**: SQL 인젝션 방지 및 쿼리 타임아웃 설정
- **Ask UI 개선**: 응답을 차트/카드로 동적 렌더링, 쿼리 히스토리 및 북마크 기능

### Changed
- `/api/analytics/sales` API: 날짜 범위, SKU 필터링 지원, 응답 구조 표준화
- `/api/ask` API: 의도 분류 확장, 안전한 SQL 실행, 차트 데이터 반환

### Fixed
- 차트 렌더링 문제: Recharts 컴포넌트 타입 안전성 개선
- 데이터 포맷팅: KRW 통화, 천단위 구분자, 날짜 포맷 통일

## [0.1.2] - 2025-08-21
### Added
- Items 업로드/목록/리셋 UI 추가 (`/admin/items`, `/admin/items/upload`)
- 업로드 API 고도화(`/api/upload`): 서비스키 사용, `core.items` UPSERT(RLS/정책 포함)
- Analytics 목업/요약: `core.sales` 테이블 + RPC(`generate_mock_sales`, `sales_summary_monthly`, `sales_recent`, `sales_top_sku_days`)
- Analytics 페이지(`/admin/analytics/sales`): 목업 생성(자동 새로고침), 월별 표/막대차트, Top 5, 최근 50건
- 자연어 질의 데모(`/admin/ask`, `/api/ask`): "최근 N일 top K sku", "월별 매출 추세"

### Changed
- 웹 API 런타임을 node로 고정하여 .env 로딩 안정화
- 헤더/네비에 Items/Analytics/Ask 링크 추가

### Fixed
- Supabase 함수 시그니처 캐시 이슈 해결: `sales_recent`, `sales_top_sku_days` 재정의 및 pg_notify 리로드 가이드 반영

### Changed
- Next.js App Router 기본 구성 정리, `experimental.appDir` 경고 제거
- README 보강: 실행법(npm/pnpm 병기), 헬스 체크(집계/개별), 문서 운영 규칙
- Windows/맥 교차 개발 워크플로우 정리(`git pull --rebase`, `npm i`, `npm run dev:all`)

### Fixed
- TS 빌드 에러(중복 타입, `csvToJson` 타입) 정리
- PowerShell 입력 이슈(PSReadLine)로 인한 단일 명령 실행 가이드 추가

## [0.1.0] - 2025-08-21
### Added
- Supabase 기반 멀티테넌트 구조 초안 설계 및 RLS 정책 적용
- Expo 기반 스캔앱 제작 (바코드 스캔, 오프라인 저장, 성능 개선)
- Next.js 웹 어드민 기본 화면 생성 (로그인, 대시보드, 데이터 업로드)
- Retool 관리자 페이지 기초 연결
- GitHub 레포 `velomano/joogo` 초기화 및 문서 체계 생성 (README, CHANGELOG, ARCHITECTURE, ROADMAP, RUNBOOK)
- Windows ↔ Mac 개발 환경 분리, npm 기반 실행 스크립트 정리

### Changed
- 패키지 매니저 pnpm → npm 전환
- README 실행/설치 가이드 최신화
- .env 구성 단순화 (최소 세트 vs 확장 세트 구분)

### Fixed
- 중복된 pnpm 설정 제거
- 환경변수 누락 시 서버 미기동 문제 해결
- 웹 어드민/백엔드 헬스체크 개선

## [Unreleased]
- 헬스 상태 집계 API (`/api/health`) 추가 예정
- CSV 업로드 → 스캔앱 연동 테스트 보강
- GitHub Issues 기반 태스크 관리 전환
