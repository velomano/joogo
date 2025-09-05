# 데이터베이스 스키마 및 핵심 정보

## 📊 데이터베이스 구조

### Supabase 테이블
- **메인 테이블**: `analytics.fact_sales`
- **스키마**: `analytics`
- **데이터베이스**: Supabase PostgreSQL

### 주요 컬럼 구조
```sql
analytics.fact_sales:
├── id (bigint) - 기본키
├── tenant_id (uuid) - 테넌트 ID
├── sale_date (date) - 판매일
├── region (text) - 지역
├── channel (text) - 채널
├── category (text) - 카테고리
├── sku (text) - SKU 코드
├── qty (numeric) - 수량
├── revenue (numeric) - 매출
├── ad_cost (numeric) - 광고비
├── discount_rate (numeric) - 할인율
├── tavg (numeric) - 평균온도
├── file_id (uuid) - 파일 ID
├── row_num (integer) - 행 번호
├── original_data (jsonb) - 원본 데이터
└── created_at (timestamp) - 생성일시
```

## 🔧 RPC 함수

### 함수 접두사
- **패턴**: `board_*`
- **용도**: 대시보드 데이터 조회

### 주요 RPC 함수
1. **`board_reorder_points`** - 재고 리오더 포인트 계산
2. **`board_abc_by_sku`** - ABC 분석
3. **`board_reg_qty_tavg`** - 수량-온도 회귀분석
4. **`board_reg_rev_spend`** - 매출-광고비 회귀분석
5. **`board_eol_candidates`** - 단종 후보
6. **`board_top_movers`** - 상위 이동 상품

### board_reorder_points 함수
**반환 필드 (8개):**
- `sku` (text) - SKU 코드
- `avg_daily` (numeric) - 일평균 판매량
- `std_daily` (numeric) - 일평균 판매량 표준편차
- `reorder_point` (numeric) - 리오더 포인트
- `stock_on_hand` (numeric) - 현재 재고
- `unit_cost` (numeric) - 단가
- `days_of_supply` (numeric) - 공급일수
- `reorder_gap_days` (numeric) - 리오더 갭 일수

## 📈 계산 로직

### 재고 관련 계산
```sql
-- 단가 계산
unit_cost = revenue / qty (qty > 0일 때)

-- 현재 재고
stock_on_hand = SUM(qty)

-- 공급일수
days_of_supply = stock_on_hand / avg_daily

-- 리오더 갭 일수
reorder_gap_days = (stock_on_hand - reorder_point) / avg_daily

-- 리오더 포인트
reorder_point = avg_daily + (z * std_daily)
```

### 재고 상태 분류
- **⚠️ 긴급 리오더**: `reorder_gap_days <= 3`
- **🔍 리오더 검토**: `3 < reorder_gap_days <= 7`
- **✅ 안정**: `reorder_gap_days > 7`
- **📉 단종 후보**: `days_since_last_sale >= 30`

## 🏗️ 프로젝트 구조

### API 엔드포인트
- **재고 인사이트**: `/api/board/insights`
- **재고 디버깅**: `/api/debug-inventory`
- **RPC 테스트**: `/api/test-reorder-function`

### 주요 컴포넌트
- **재고 상태 카드**: 재고 상태별 개수 표시
- **재고 테이블**: 상세 재고 정보
- **필터링**: 지역, 채널, 카테고리별 필터

## 🔍 디버깅 정보

### 로그 패턴
```
🔍 조회할 SKU 목록: [SKU-001, SKU-002, ...]
🔍 재고 데이터 조회 결과: { count: N, error: null }
🔍 board_reorder_points RPC 결과: [...]
```

### 일반적인 문제
1. **테이블명 오류**: `fact_sales` → `analytics.fact_sales`
2. **컬럼명 오류**: `unit_cost` → `revenue / qty`
3. **스키마 누락**: `analytics.` 접두사 필요
4. **데이터 타입**: `qty::numeric` 변환 필요

## 📝 참고사항

- **바코드 컬럼**: 추후 필수 (현재는 SKU 사용)
- **CSV 형식**: 파일 업로드 시 CSV만 지원
- **Git 브랜치**: `main` 기본 브랜치
- **패키지 매니저**: `pnpm` 사용
