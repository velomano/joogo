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
