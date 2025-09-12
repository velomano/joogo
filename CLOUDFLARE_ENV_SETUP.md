# Cloudflare Pages 환경 변수 설정 가이드

## 🚨 문제 해결: 로컬은 성공, 배포는 실패

로컬에서는 Mock 서버(`localhost:8787`)에 접근할 수 있지만, Cloudflare Pages 배포 환경에서는 접근할 수 없어서 API 호출이 실패합니다.

## ✅ 해결 방법

### 1. Cloudflare Pages 환경 변수 설정

Cloudflare Pages 대시보드에서 다음 환경 변수들을 설정하세요:

**Settings → Environment variables → Production 환경에 추가:**

```bash
# Supabase 설정 (필수)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Mock API 설정 (선택사항 - 공개 URL이 있는 경우)
MOCK_CAFE24_URL=https://your-mock-cafe24.com
MOCK_ADS_URL=https://your-mock-ads.com
MOCK_WEATHER_URL=https://your-mock-weather.com

# 또는 통합 Mock API
MOCK_BASE_URL=https://your-mock-api.com
ADS_BASE_URL=https://your-mock-api.com
WEATHER_BASE_URL=https://your-mock-api.com

# 기타 설정
OPENAI_API_KEY=your-openai-key-here
TENANT_ID_DEFAULT=default
NEXT_PUBLIC_DATA_SOURCE=mock
```

### 2. 데이터 소스 우선순위

수정된 API는 다음 순서로 데이터를 조회합니다:

1. **Mock 서버** (환경 변수가 설정된 경우)
2. **Supabase 직접 조회** (Mock 서버가 없는 경우)
3. **Fallback 데이터** (모든 것이 실패한 경우)

### 3. 현재 상태 확인

배포 후 다음 URL로 API 상태를 확인할 수 있습니다:

```bash
# Sales API 테스트
curl "https://joogo.pages.dev/api/sales?from=2025-01-01&to=2025-01-10"

# Ads API 테스트  
curl "https://joogo.pages.dev/api/ads?from=2025-01-01&to=2025-01-10"

# 응답 헤더에서 데이터 소스 확인
curl -I "https://joogo.pages.dev/api/sales"
# X-Data-Source: supabase (또는 mock-server, fallback)
```

## 🔧 추가 개선사항

### Mock 데이터 생성 (선택사항)

Supabase에 실제 데이터가 없는 경우, Mock 데이터를 생성할 수 있습니다:

```bash
# Mock 데이터 생성 API 호출
curl -X POST "https://joogo.pages.dev/api/board/mock-data" \
  -H "Content-Type: application/json" \
  -d '{"tenant":"demo","source":"mock","hours":24}'
```

### 환경별 설정

- **Production**: 실제 Supabase 데이터베이스 사용
- **Preview**: 테스트용 Mock 데이터 사용
- **Development**: 로컬 Mock 서버 사용

## 📊 모니터링

Cloudflare Pages 대시보드에서 다음을 확인하세요:

1. **Functions 탭**: API 호출 로그 및 오류
2. **Analytics 탭**: 트래픽 및 성능 지표
3. **Settings → Environment variables**: 설정된 변수들

## 🚀 배포 후 테스트

1. 환경 변수 설정 완료
2. 코드 푸시 및 자동 배포
3. API 엔드포인트 테스트
4. 대시보드 UI 확인

이제 로컬과 배포 환경 모두에서 정상적으로 데이터를 불러올 수 있습니다!
