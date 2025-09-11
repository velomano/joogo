# 기상청 API 설정 가이드

## 1. 기상청 공공데이터포털 API 키 발급

1. [공공데이터포털](https://data.go.kr) 접속
2. 회원가입/로그인
3. "기상청_단기예보 조회서비스" 검색
4. "활용신청" 클릭하여 API 키 발급

## 2. 환경변수 설정

`apps/web-admin/.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# 기상청 공공데이터포털 API 키
WEATHER_API_KEY=발급받은_API_키_입력

# 기존 환경변수들
NEXT_PUBLIC_USE_MOCK=1
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
TENANT_ID_DEFAULT=00000000-0000-0000-0000-000000000001
```

## 3. API 사용 범위

- **실제 데이터**: 현재 날짜부터 7일 이내의 미래 날짜
- **Mock 데이터**: 과거 날짜 또는 7일 초과 범위
- **지역 지원**: 서울, 부산, 대구, 인천, 광주, 대전, 울산, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주

## 4. 데이터 소스 표시

차트에서 데이터 소스를 확인할 수 있습니다:
- `source: 'weather_api'`: 실제 기상청 API 데이터
- `source: 'mock_fallback'`: Mock 데이터 (API 오류 시)

## 5. 주의사항

- 기상청 API는 일일 호출 제한이 있습니다
- 과거 데이터는 제공하지 않으므로 Mock 데이터를 사용합니다
- API 키가 없거나 오류 시 자동으로 Mock 데이터로 fallback됩니다
