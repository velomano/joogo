# 배포 환경 테스트 가이드

## 배포 도메인
- **Production**: https://joogo.pages.dev
- **Preview**: https://6de4a6ae.joogo.pages.dev

## 1. 환경변수 확인

### Cloudflare Pages 환경변수 설정
다음 변수들이 Production 환경에 설정되어 있는지 확인:

```bash
# 필수 변수
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE=your-service-role-key

# Mock API (로컬이 아닌 공개 URL)
MOCK_BASE_URL=https://your-mock-api.com
ADS_BASE_URL=https://your-mock-api.com
WEATHER_BASE_URL=https://your-mock-api.com
```

## 2. 데이터 적재 (1회 실행)

### Mock 데이터 생성 및 적재
```bash
# 1. Mock 데이터 생성 (24시간치)
curl -X POST "https://joogo.pages.dev/api/board/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant": "demo",
    "source": "mock", 
    "hours": 24
  }'

# 성공 응답 예시:
# {"ok": true, "file_id": "uuid", "inserted": 1440}
```

## 3. 스모크 테스트 (3종)

### 3-1. 상태 확인
```bash
curl "https://joogo.pages.dev/api/board/status?tenant_id=demo"
```

**예상 응답:**
```json
{
  "ok": true,
  "sales": {
    "totalRevenue": 1234567,
    "totalQty": 890,
    "avgDaily": 51440,
    "days": 24
  },
  "sku": {
    "uniqueSkus": 45,
    "topSku": "SKU-001",
    "topSkuRevenue": 12345
  }
}
```

### 3-2. 데이터 신선도 확인
```bash
curl "https://joogo.pages.dev/api/analytics/freshness"
```

**예상 응답:**
```json
{
  "last_sales": "2025-01-10T15:00:00Z",
  "last_ads": "2025-01-10T15:00:00Z", 
  "last_weather": "2025-01-10T15:00:00Z"
}
```

### 3-3. ROAS 분석 확인
```bash
curl "https://joogo.pages.dev/api/analytics/roas?tenant_id=demo&from=2025-01-01&to=2025-01-10"
```

**예상 응답:**
```json
{
  "rows": [
    {
      "ts": "2025-01-01T00:00:00Z",
      "channel": "google",
      "revenue": 50000,
      "ad_cost": 10000,
      "roas": 5.0
    }
  ]
}
```

## 4. 대시보드 확인

### 메인 대시보드
- https://joogo.pages.dev/board
- 차트와 카드가 데이터와 함께 표시되는지 확인

### 개별 분석 페이지
- https://joogo.pages.dev/board/sales
- https://joogo.pages.dev/board/abc  
- https://joogo.pages.dev/board/inventory

## 5. 문제 해결

### 빈 화면이 나오는 경우
1. 환경변수 설정 확인
2. Mock API 접근 가능 여부 확인
3. 데이터 적재 재실행

### Mock API 접근 불가능한 경우
- 로컬 Mock 서버를 공개 URL로 배포
- 또는 Ingest를 수동으로 실행하여 정적 데이터 사용

## 6. 자동화 (선택사항)

### CRON 스케줄러 설정
```bash
# 5분마다 Mock 데이터 갱신
*/5 * * * * curl -X POST "https://joogo.pages.dev/api/board/ingest" -d '{"tenant":"demo","source":"mock","hours":1}'
```

### GitHub Actions 스케줄러
```yaml
# .github/workflows/scheduled-ingest.yml
name: Scheduled Ingest
on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다
jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Ingest
        run: |
          curl -X POST "https://joogo.pages.dev/api/board/ingest" \
            -H "Content-Type: application/json" \
            -d '{"tenant":"demo","source":"mock","hours":1}'
```
