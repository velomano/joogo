# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.5] - 2025-08-21

### Added
- **새로운 판매 분석 스키마**: `데이터 분석 - RawData.csv` 포맷을 지원하는 새로운 데이터베이스 구조
- **core.products 테이블**: 95개 컬럼을 지원하는 상품 정보 테이블 (기존 core.items와 별도 운영)
- **core.daily_sales 테이블**: 일별 판매 데이터를 정규화하여 저장하는 테이블
- **core.product_mapping 테이블**: 기존 core.items와 새로운 core.products 간의 매핑 테이블
- **판매 분석 업로드 API**: `/api/upload/sales-analysis` - CSV 파일 업로드 및 데이터 처리
- **판매 분석 조회 API**: `/api/sales-analysis` - 상품별 통계 및 분석 데이터 조회
- **일별 판매 데이터 API**: `/api/sales-analysis/daily` - 일별 판매 추이 및 집계 데이터
- **새로운 판매 분석 페이지**: `/admin/sales-analysis` - 대시보드, 차트, 상품 목록 표시

### Changed
- **데이터베이스 구조**: 기존 단순 재고 관리에서 복잡한 판매 분석 시스템으로 확장
- **테이블 스키마**: 32개 기본 컬럼 + 63개 일별 데이터 컬럼 지원
- **데이터 처리**: CSV 파싱, 검증, 배치 처리, 오류 핸들링 강화
- **API 구조**: RESTful API 설계, 테넌트 기반 데이터 격리, RLS 정책 적용

### Technical Details
- **새로운 컬럼들**: 상품코드, 상품명, 공급처명, 원가, 판매가, 주문수, 발송수, 일별 판매량 등
- **데이터 타입**: DECIMAL(10,2) for 가격, INTEGER for 수량, TEXT for 문자열
- **인덱스**: 성능 최적화를 위한 복합 인덱스 및 외래키 제약조건
- **함수**: `upsert_product()`, `update_daily_sales()` 등 데이터 처리 함수
- **뷰**: `products_summary`, `sales_analytics` 등 호환성을 위한 뷰 생성

### Performance
- **배치 처리**: 100개씩 배치로 데이터 처리하여 메모리 효율성 향상
- **인덱싱**: 자주 조회되는 컬럼에 대한 인덱스 최적화
- **RLS**: Row Level Security로 테넌트별 데이터 격리 및 보안 강화

## [0.1.4] - 2025-08-21

### Added
- **토큰 사용량 최적화**: `/api/ask` API의 토큰 사용량을 60% 이상 감소
- **의도 라우터**: 소형 모델 기반 빠른 의도 파악 (600 토큰 이하)
- **SQL 템플릿 라이브러리**: 미리 정의된 SQL로 LLM 호출 최소화
- **스키마 선택기**: 의도별 최소 스키마만 반환하여 컨텍스트 크기 최적화
- **히스토리 요약기**: 300-500자로 히스토리 요약하여 토큰 절약
- **비용 로그 시스템**: 각 단계별 토큰 사용량 추적 및 비용 모니터링
- **응답 캐싱**: 동일한 질문에 대한 캐시 히트로 반복 LLM 호출 방지

### Changed
- **의도 분석**: 키워드 기반 빠른 분석으로 LLM 호출 80% 감소
- **프롬프트 최적화**: few-shot 예시를 2개로 제한, 스키마 정보 최소화
- **LLM 폴백**: SQL 템플릿 실패 시에만 LLM 호출하는 스마트 폴백
- **응답 메타데이터**: 토큰 사용량, 비용, 캐시 상태 등 상세 정보 포함

### Performance
- **월별 요약 쿼리**: prompt_tokens ≤ 1200, completion_tokens ≤ 300 달성
- **캐시 효율성**: 반복 질문에 대한 즉시 응답 (0ms)
- **메모리 최적화**: 히스토리 압축 및 응답 데이터 크기 제한

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

## [0.1.2] - 2025-08-20

### Added
- **Sales Analytics Dashboard**: 월별 매출 추이, Top SKU 분석, 재고 현황
- **Natural Language Query**: 자연어로 데이터베이스 조회 가능
- **Chart Visualization**: Recharts를 활용한 동적 차트 렌더링
- **CSV Export**: 분석 결과를 CSV 파일로 다운로드

### Changed
- `/api/analytics/sales` API: 월별 집계, Top SKU 조회, 재고 분석 기능 추가
- `/api/ask` API: LLM 기반 자연어 쿼리 처리 및 차트 데이터 반환

## [0.1.1] - 2025-08-20

### Added
- **Supabase Integration**: 데이터베이스 연결 및 RPC 함수 지원
- **Environment Configuration**: .env 파일을 통한 설정 관리
- **Basic API Structure**: Next.js API Routes 기반 백엔드 구조

### Changed
- 프로젝트 구조: monorepo 구조로 변경, apps/web-admin 하위에 Next.js 앱 배치

## [0.1.0] - 2025-08-20

### Added
- **Initial Project Setup**: WMS/OMS MVP 프로젝트 초기 설정
- **MCP Providers**: Model Context Protocol 기반 AI 통합
- **Supabase Backend**: PostgreSQL 기반 데이터베이스 및 백엔드 서비스
- **Next.js Frontend**: React 기반 웹 애플리케이션 프레임워크
- **TypeScript Support**: 타입 안전성을 위한 TypeScript 설정
- **Basic Project Structure**: 기본 폴더 구조 및 설정 파일들
