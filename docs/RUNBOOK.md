# Runbook

## 로컬 개발 실행
1. 레포 클론: `git clone https://github.com/velomano/joogo.git`
2. 의존성 설치: `npm i`
3. 실행: `npm run dev:all`
   - 웹: http://localhost:3000
   - 백엔드: 7301(files), 7302(catalog), 7303(orders), 7304(shipping)

## 헬스 체크
- 웹: `curl localhost:3000/api/health`
- 개별 서비스: `curl localhost:7301/health` 등
- 정상 응답 = `200 OK`

## 트러블슈팅
- 포트 충돌 → `lsof -i :3000` 후 프로세스 종료
- .env 최소 세트 누락 확인
- 캐시 문제 → `rm -rf apps/web/.next` 후 재실행
- Git fetch/pull 자동화 → Cursor Settings.json에 git.autofetch 활성화

## 배포/협업
- 작업 종료 후 `git add -A && git commit -m "..." && git push`
- 맥/윈도우 전환 시 `git pull --ff-only`로 최신화

## Health Check (집계 & 개별)
- 집계(웹): http://localhost:3000/api/health
- 개별(프로바이더):
  - files:    http://localhost:7301/health
  - catalog:  http://localhost:7302/health
  - orders:   http://localhost:7303/health
  - shipping: http://localhost:7304/health

### curl 예시 (DEV_TOKEN 필요 시)
# Windows PowerShell
iwr http://localhost:7301/health -Headers @{Authorization='Bearer DEV_TOKEN'}

# macOS/Linux
curl -H "Authorization: Bearer DEV_TOKEN" http://localhost:7301/health

## Windows ↔ mac 교차 개발 루틴
1) 변경 푸시(Windows) → git add -A && git commit -m "..." && git push
2) 맥에서: git pull --rebase → npm i(필요 시) → npm run dev:all
3) 환경차로 PATH/CLI가 다를 때: 터미널 재시작 또는 임시 PATH 추가
