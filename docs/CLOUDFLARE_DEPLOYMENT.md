# 클라우드플레어 배포 가이드 (2024-08-31 업데이트)

## 개요
이 프로젝트는 클라우드플레어 Pages를 통해 자동 배포되도록 설정되어 있습니다. Wrangler v4 호환성으로 최적화되었습니다.

## 설정 파일

### 1. wrangler.toml (Pages 전용 설정)
```toml
name = "joogo"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

# Pages 설정
pages_build_output_dir = "apps/web-admin/.next"

[env.production]
name = "joogo-prod"

[env.preview]
name = "joogo-preview"
```

**주요 변경사항:**
- ✅ `pages_build_output_dir` 추가로 Pages 빌드 출력 디렉토리 명시
- ✅ `account_id` 제거 (Pages에서 지원하지 않음)
- ✅ `[build]` 섹션 제거 (Pages에서 지원하지 않음)
- ✅ `staging` → `preview` 환경명 변경 (Pages 표준)

### 2. GitHub Actions (.github/workflows/cloudflare-deploy.yml)
main 브랜치에 푸시될 때마다 자동으로 클라우드플레어에 배포됩니다.

**최적화된 설정:**
```yaml
- name: Deploy to Cloudflare Pages
  uses: cloudflare/pages-action@v1
  with:
    projectName: joogo
    directory: .next
    gitHubToken: ${{ secrets.GITHUB_TOKEN }}
    workingDirectory: apps/web-admin
    apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 환경 변수 설정

GitHub Secrets에 다음 값들을 설정해야 합니다:

- `CLOUDFLARE_API_TOKEN`: 클라우드플레어 API 토큰
- `CLOUDFLARE_ACCOUNT_ID`: 클라우드플레어 계정 ID

## 수동 배포

### 로컬에서 배포
```bash
# 프로덕션 배포
pnpm deploy:cloudflare

# 프리뷰 배포
pnpm deploy:cloudflare:preview
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
- 프로젝트 이름 확인 (`joogo`로 수정됨)

### Wrangler v4 호환성 문제
- `pages_build_output_dir` 설정 확인
- Pages 전용 설정 사용 (Workers 설정 제거)
- 환경명을 `preview`와 `production`으로 제한

## 최근 해결된 문제들

### ✅ GitHub Actions 경로 문제
- **문제**: `/apps/web-admin/apps/web-admin/.next` (중복 경로)
- **해결**: `directory: .next`로 수정

### ✅ Wrangler v4 호환성
- **문제**: Pages에서 지원하지 않는 옵션들
- **해결**: Pages 전용 설정으로 최적화

### ✅ 프로젝트명 불일치
- **문제**: `joogo-wms-oms` vs 실제 프로젝트명 `joogo`
- **해결**: 올바른 프로젝트명으로 수정

## 모니터링

클라우드플레어 대시보드에서 다음을 확인할 수 있습니다:
- 배포 상태
- 방문자 통계
- 성능 메트릭
- 오류 로그

## 성공적인 배포를 위한 체크리스트

- [ ] GitHub Secrets에 API 토큰과 계정 ID 설정
- [ ] wrangler.toml이 Pages 전용 설정으로 최적화됨
- [ ] 프로젝트명이 `joogo`로 올바르게 설정됨
- [ ] GitHub Actions 워크플로우가 정상 실행됨
- [ ] 빌드 과정에서 오류가 발생하지 않음
- [ ] Cloudflare Pages에서 배포 상태 확인

## 다음 단계

배포가 성공적으로 완료되면:
1. 온라인 환경에서 UI 테스트
2. 성능 모니터링 및 최적화
3. 사용자 피드백 수집 및 개선
