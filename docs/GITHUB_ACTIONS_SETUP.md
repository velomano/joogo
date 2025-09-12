# GitHub Actions 크론 설정 가이드

## 1. GitHub Secrets 설정

GitHub 레포지토리에서 다음 Secrets를 설정해야 합니다:

### Settings → Secrets and variables → Actions → New repository secret

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
CRON_SECRET=your-cron-secret
PAT_TOKEN=your-github-token
REPO_NAME=your-username/joogo
```

## 2. GitHub Token 생성

1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. "Generate new token (classic)" 클릭
3. 권한 선택:
   - `repo` (전체 레포지토리 접근)
   - `workflow` (워크플로우 실행)
4. 토큰 생성 후 `PAT_TOKEN`으로 저장

## 3. 자동 실행 확인

- **매시간 정각**에 자동으로 크론 작업 실행
- **수동 실행**도 가능 (Actions 탭에서 "Cron Data Ingest" 워크플로우 실행)

## 4. 웹 대시보드 사용

1. "DB 데이터 불러오기" 버튼 클릭
2. 데이터가 없으면 GitHub Actions 크론 자동 실행
3. 1-2분 후 페이지 새로고침

## 5. 모니터링

- GitHub Actions 탭에서 실행 상태 확인
- 로그에서 데이터 수집 과정 모니터링
- 실패 시 알림 설정 가능

## 6. 장점

✅ **무료**: GitHub Actions 무료 플랜 사용
✅ **안정적**: GitHub 인프라 사용
✅ **자동화**: 매시간 자동 실행
✅ **모니터링**: 실행 로그 확인 가능
✅ **수동 실행**: 필요시 즉시 실행 가능
