# 📁 샘플 데이터 파일

이 폴더는 Joogo WMS/OMS 프로젝트의 테스트 및 개발용 샘플 데이터를 관리합니다.

## 📊 현재 샘플 파일

### `sample_unified_board.csv`
- **용도**: 판매 실적 BOARD 테스트용 메인 샘플 데이터
- **크기**: 122KB (961행)
- **기간**: 2025-01-01 ~ 2025-04-30 (4개월)
- **컬럼**: 28개 (date, region, channel, sku, category, segment, qty, unit_price, discount_rate, unit_cost, revenue, tavg, tmax, tmin, precipitation, spend, clicks_mkt, impr_mkt, section, slot_rank, impr_merch, clicks_merch, campaign, platform, is_event, stock_on_hand, lead_time_days)

#### 데이터 특징
- **지역**: SEOUL, BUSAN, DAEGU, INCHEON, GWANGJU
- **채널**: web, app
- **SKU**: SKU-001 ~ SKU-007
- **카테고리**: Outer, Inner, Top, Bottom, Accessory, Kids, Shoes
- **이벤트**: is_event=1 데이터 없음 (이벤트 없음 테스트용)

## 🎯 사용 방법

### 1. 웹 애플리케이션에서 사용
```bash
# 웹앱 public 폴더에 복사
cp samples/sample_unified_board.csv apps/web-admin/public/
```

### 2. 직접 업로드 테스트
- 판매 실적 BOARD 페이지에서 "파일 선택" 버튼으로 업로드
- 또는 "샘플 불러오기" 버튼으로 웹에서 로드

### 3. 개발/테스트용
- CSV 파싱 로직 테스트
- 차트 렌더링 테스트
- 필터링 기능 테스트
- 성능 테스트 (960행 데이터)

## 📋 추가 예정 샘플

- `sample_with_events.csv` - 이벤트 데이터 포함 버전
- `sample_large_dataset.csv` - 대용량 데이터 (10k+ 행)
- `sample_missing_columns.csv` - 일부 컬럼 누락 버전
- `sample_invalid_data.csv` - 잘못된 데이터 형식 테스트용

## 🔧 관리 규칙

1. **파일명 규칙**: `sample_[용도]_[설명].csv`
2. **크기 제한**: 개발용은 1MB 이하 권장
3. **데이터 보안**: 실제 고객 데이터 사용 금지
4. **버전 관리**: Git에 포함하여 팀 공유

## 📝 업데이트 이력

- **2025-09-04**: samples 폴더 생성 및 sample_unified_board.csv 이동
- **2025-09-03**: sample_unified_board.csv 생성 (961행, 4개월 데이터)
