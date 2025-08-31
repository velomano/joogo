# 클라우드플레어 배포 가이드

## 개요
이 프로젝트는 클라우드플레어 Pages를 통해 자동 배포되도록 설정되어 있습니다.

## 설정 파일

### 1. wrangler.toml
클라우드플레어 Workers 설정 파일입니다.

### 2. GitHub Actions (.github/workflows/cloudflare-deploy.yml)
main 브랜치에 푸시될 때마다 자동으로 클라우드플레어에 배포됩니다.

## 환경 변수 설정

GitHub Secrets에 다음 값들을 설정해야 합니다:

- `CLOUDFLARE_API_TOKEN`: 클라우드플레어 API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: 클라우드플레어 계정 ID

## 수동 배포

### 로컬에서 배포
```bash
# 프로덕션 배포
pnpm deploy:cloudflare

# 스테이징 배포
pnpm deploy:cloudflare:staging
```

### 개별 앱 배포
```bash
# web-admin 앱만 배포
pnpm --filter web-admin deploy
```

## 배포 프로세스

1. main 브랜치에 코드가 푸시됨
2. GitHub Actions가 자동으로 트리거됨
3. 의존성 설치 및 빌드
4. 클라우드플레어 Pages에 배포
5. 배포 상태 확인

## 문제 해결

### 빌드 실패
- `pnpm build` 명령어로 로컬 빌드 테스트
- TypeScript 오류 확인
- 의존성 문제 확인

### 배포 실패
- 클라우드플레어 API 토큰 확인
- 계정 ID 확인
- 프로젝트 이름 확인

## 모니터링

클라우드플레어 대시보드에서 다음을 확인할 수 있습니다:
- 배포 상태
- 방문자 통계
- 성능 메트릭
- 오류 로그
