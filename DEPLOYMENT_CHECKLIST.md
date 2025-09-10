# 🚀 배포 체크리스트

## ✅ 완료된 작업

### 백엔드/분석 레이어
- [x] Mock Cafe24·Ads·Weather → DB 스키마 → 분석 API 연결 완료
- [x] ROAS/Freshness/Status/Charts/Insights API 구현
- [x] Edge Runtime 통일 (11개 API 라우트)
- [x] 핸들러 내부 Supabase 클라이언트 생성

### 배포/런타임
- [x] Edge 런타임 통일 + CI/CD 정리로 배포 성공
- [x] Cloudflare Pages 자동 배포 설정
- [x] 25MiB 제한 문제 해결
- [x] 중복 워크플로우 제거

## 🔶 배포 환경 점검 필요

### 1. 환경변수 설정 (Cloudflare Pages)
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

### 2. 데이터 적재 (1회 실행)
```bash
# Mock 데이터 생성 및 적재
curl -X POST "https://joogo.pages.dev/api/board/mock-data" \
  -H "Content-Type: application/json" \
  -d '{"tenant":"demo","source":"mock","hours":24}'
```

### 3. 스모크 테스트
```bash
# 상태 확인
curl "https://joogo.pages.dev/api/board/status?tenant_id=demo"

# 신선도 확인  
curl "https://joogo.pages.dev/api/analytics/freshness"

# ROAS 확인
curl "https://joogo.pages.dev/api/analytics/roas?tenant_id=demo&from=2025-01-01&to=2025-01-10"
```

### 4. 대시보드 확인
- https://joogo.pages.dev/board
- https://joogo.pages.dev/board/sales
- https://joogo.pages.dev/board/abc
- https://joogo.pages.dev/board/inventory

## ⚠️ 주의사항

### 실서버에서 Mock 사용
- 로컬 127.0.0.1:* Mock는 배포 환경에서 접근 안 됨
- 원격(Mock) URL을 .env로 지정하거나 Ingest를 수동 실행 필요
- 대시보드에 데이터가 보이려면 Mock 데이터 생성 필수

## 🔧 추가 개선사항 (선택)

### 자동화
- [ ] CRON 스케줄러: Ingest를 5분/10분마다 자동화
- [ ] 첫 진입 시 데모 시드 버튼/엔드포인트 제공

### 모니터링
- [ ] 배포 상태 모니터링
- [ ] API 응답 시간 모니터링
- [ ] 에러 로그 수집

## 📋 배포 상태

- **도메인**: https://joogo.pages.dev
- **상태**: ✅ 배포 성공
- **Edge Runtime**: ✅ 통일 완료
- **CI/CD**: ✅ 자동 배포 설정 완료
- **데이터**: 🔶 Mock 데이터 생성 필요
