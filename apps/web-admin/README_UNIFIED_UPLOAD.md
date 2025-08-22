# 🚀 통합 데이터 업로드 시스템

단일 CSV 파일로 재고와 판매 데이터를 동시에 업로드할 수 있는 시스템입니다.

## 📋 주요 기능

- **단일 CSV 업로드**: 재고와 판매 데이터를 하나의 파일로 처리
- **자동 분류**: 판매행과 스냅샷행을 자동으로 구분하여 적절한 테이블에 저장
- **데이터 검증**: CSV 형식, 데이터 타입, 비즈니스 규칙 검증
- **에러 처리**: 상세한 에러 메시지와 로그 제공
- **실시간 미리보기**: 업로드된 데이터의 미리보기 제공

## 📁 페이지 구조

```
/admin/upload-one          # 통합 업로드 페이지
/api/upload/unified       # 통합 업로드 API
/admin/insights           # 인사이트 분석 페이지
/api/insights            # 인사이트 분석 API
```

## 📊 CSV 형식

### 필수 헤더 (정확한 컬럼명)

```csv
tenant_id,sale_date,barcode,상품명,옵션명,sale_qty,unit_price_krw,revenue_krw,channel,stock_qty
```

### 컬럼 설명

| 컬럼명 | 타입 | 설명 | 예시 |
|--------|------|------|------|
| `tenant_id` | UUID | 테넌트 식별자 | `84949b3c-2cb7-4c42-b9f9-d1f37d371e00` |
| `sale_date` | YYYY-MM-DD | 판매/스냅샷 날짜 | `2025-08-22` |
| `barcode` | 정수/문자열 | 상품 바코드 | `123456789` |
| `상품명` | 문자열 | 상품 기본명 | `티셔츠`, `후디` |
| `옵션명` | 문자열 | 상품 옵션 | `레드`, `블루`, `L` |
| `sale_qty` | 정수 | 판매 수량 | `5` (판매행), `0` (스냅샷) |
| `unit_price_krw` | 정수 | 단가 (원화, 기호 없음) | `15000` |
| `revenue_krw` | 정수 | 매출 (원화, 기호 없음) | `75000` |
| `channel` | 문자열 | 판매 채널 | `online`, `offline`, `wholesale`, `snapshot` |
| `stock_qty` | 정수 | 재고 수량 | `10` |

### 데이터 규칙

#### 판매행 (sale_qty > 0)
- `sale_date` 필수
- `channel`은 `snapshot`이 될 수 없음
- `revenue_krw`가 비어있으면 `sale_qty * unit_price_krw`로 자동 계산
- `sales` 테이블에 저장

#### 스냅샷행 (sale_qty = 0 AND channel = snapshot)
- 재고 정보만 기록
- `items` 테이블에 저장
- `productName`은 `옵션명 + ' ' + 상품명`으로 자동 생성

### 인코딩

- **권장**: UTF-8
- **지원**: UTF-8 with BOM (utf-8-sig)
- BOM은 자동으로 제거됩니다

## 🔧 사용법

### 1. 업로드 페이지 접속

```
http://localhost:3001/admin/upload-one
```

### 2. 데이터 입력

1. **Tenant ID 입력**: UUID 형식으로 입력
2. **CSV 파일 선택**: 위 형식에 맞는 CSV 파일 선택
3. **업로드 시작**: "🚀 업로드 시작" 버튼 클릭

### 3. 결과 확인

업로드 완료 후 다음 정보를 확인할 수 있습니다:

- **요약 통계**: 총 행 수, 판매 데이터, 재고 데이터, 건너뛴 행
- **에러 목록**: 검증 실패한 행들의 상세 에러 메시지
- **데이터 미리보기**: 업로드된 데이터의 상위 5행 미리보기

## 📈 인사이트 분석

업로드된 데이터를 기반으로 다양한 비즈니스 인사이트를 제공합니다:

### 주요 분석 항목

1. **판매 개요**: 총 판매량, 매출, 객단가
2. **판매 급증**: 갑작스런 판매 증가 패턴
3. **추세 분석**: 상승/하락 추세 SKU
4. **시즌성**: 요일별/월별 패턴
5. **재고 위험**: 재고 소진 위험도
6. **ABC 분류**: 매출 기여도별 상품 분류
7. **단가 이상치**: 비정상적인 가격 패턴
8. **채널 구성**: 채널별 매출/수량 분석

## 🗄️ 데이터베이스 스키마

### items 테이블 (재고 스냅샷)

```sql
create table public.items (
  tenant_id uuid not null,
  barcode bigint not null,
  productName text,
  product_name text,
  option_name text,
  qty integer not null default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (tenant_id, barcode)
);
```

### sales 테이블 (판매 트랜잭션)

```sql
create table public.sales (
  tenant_id uuid not null,
  sale_date date not null,
  barcode bigint not null,
  productName text,
  product_name text,
  option_name text,
  qty integer not null,
  unit_price numeric not null,
  revenue numeric not null,
  channel text not null check (channel in ('online','offline','wholesale','snapshot')),
  created_at timestamp with time zone default now()
);
```

### 주요 인덱스

```sql
-- 재고 테이블
create unique index items_tenant_barcode_uidx on items(tenant_id, barcode);

-- 판매 테이블
create index sales_tenant_date_idx on sales(tenant_id, sale_date);
create index sales_barcode_idx on sales(barcode);
create unique index sales_row_uidx on sales(tenant_id, sale_date, barcode, channel, unit_price);
```

## 🚨 주의사항

### CSV 파일 준비 시

1. **헤더 정확성**: 컬럼명이 정확히 일치해야 함
2. **데이터 타입**: 숫자는 정수, 날짜는 YYYY-MM-DD 형식
3. **인코딩**: UTF-8 권장, 한글 깨짐 주의
4. **빈 값**: `revenue_krw`는 비워둘 수 있음 (자동 계산)

### 업로드 시

1. **테넌트 ID**: 올바른 UUID 형식 확인
2. **파일 크기**: 대용량 파일은 청크 단위로 처리
3. **에러 처리**: 에러가 발생한 행은 건너뛰고 계속 진행

## 🔍 문제 해결

### 일반적인 에러

1. **"필수 헤더가 누락되었습니다"**
   - CSV 헤더가 정확한지 확인
   - 컬럼명 앞뒤 공백 제거

2. **"잘못된 날짜 형식"**
   - 날짜가 YYYY-MM-DD 형식인지 확인
   - Excel에서 날짜 형식 변환 주의

3. **"잘못된 channel"**
   - channel 값이 `online`, `offline`, `wholesale`, `snapshot` 중 하나인지 확인

4. **"판매행은 channel이 snapshot이 될 수 없습니다"**
   - `sale_qty > 0`인 행의 channel은 `snapshot`이 아니어야 함

### 성능 최적화

1. **대용량 파일**: 10,000행 이상은 청크 단위로 처리
2. **인덱스**: 데이터베이스 인덱스가 올바르게 생성되었는지 확인
3. **네트워크**: 안정적인 네트워크 환경에서 업로드

## 📞 지원

문제가 발생하거나 추가 기능이 필요한 경우:

1. 브라우저 개발자 도구의 콘솔 로그 확인
2. 서버 로그에서 상세 에러 메시지 확인
3. CSV 파일 형식 재검토
4. 데이터베이스 연결 상태 확인

---

**🚀 통합 업로드 시스템으로 효율적인 데이터 관리를 경험해보세요!**
