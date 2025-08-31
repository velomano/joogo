# 🚀 Joogo WMS/OMS

**WMS/OMS MVP with MCP providers and Supabase**

## ✨ **주요 기능**

- 📊 **데이터 분석 대시보드**: 실시간 매출 및 재고 분석
- 📁 **파일 업로드 시스템**: CSV 파일 자동 파싱 및 처리
- 🤖 **AI 기반 인사이트**: OpenAI를 활용한 데이터 분석
- 🔄 **자동화된 워크플로우**: MCP 서비스를 통한 업무 자동화
- 🌐 **클라우드플레어 배포**: 글로벌 CDN을 통한 빠른 서비스

## 🏗️ **아키텍처**

### **프론트엔드**
- **Next.js 14** + **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI** 컴포넌트
- **Edge Runtime** 지원으로 클라우드플레어 최적화

### **백엔드**
- **Supabase**: PostgreSQL + RLS + 실시간 기능
- **MCP 서비스**: 표준 프로토콜 기반 마이크로서비스
- **Node.js 워커**: 데이터 처리 및 수집

### **배포**
- **클라우드플레어 Pages**: 자동 배포 + 글로벌 CDN
- **GitHub Actions**: CI/CD 자동화
- **Edge Computing**: 전 세계 어디서나 빠른 응답

## 🚀 **빠른 시작**

### **1. 저장소 클론**
```bash
git clone https://github.com/velomano/joogo.git
cd joogo
```

### **2. 의존성 설치**
```bash
# pnpm 설치 (권장)
corepack enable
corepack prepare pnpm@9 --activate

# 의존성 설치
pnpm install
```

### **3. 환경 변수 설정**
```bash
cp cloudflare.env.example .env.local
# .env.local 파일에 실제 값들을 입력
```

### **4. 개발 서버 실행**
```bash
# 웹 관리자 (Next.js)
pnpm dev:web

# MCP 서비스들
pnpm dev:providers

# 모든 서비스 동시 실행
pnpm dev:all
```

### **5. 데이터베이스 설정**
```bash
# Supabase 시작
pnpm dev:db

# 스키마 적용
pnpm db:push
```

## 📁 **프로젝트 구조**

```
joogo/
├── 📁 apps/                    # 애플리케이션들
│   ├── 📁 web-admin/          # Next.js 웹 관리자
│   └── 📁 ingest-worker/      # 데이터 수집 워커
├── 📁 packages/                # 공통 패키지들
│   ├── 📁 shared/             # 공통 유틸리티
│   ├── 📁 mcp-catalog/        # MCP 카탈로그 서비스
│   ├── 📁 mcp-files/          # MCP 파일 서비스
│   ├── 📁 mcp-orders/         # MCP 주문 서비스
│   └── 📁 mcp-shipping/       # MCP 배송 서비스
├── 📁 docs/                    # 문서
├── 📁 scripts/                 # 유틸리티 스크립트
└── 📁 supabase/                # Supabase 설정
```

## 🔧 **사용 가능한 스크립트**

```bash
# 개발
pnpm dev:web          # 웹 관리자 개발 서버
pnpm dev:providers    # MCP 서비스들 개발 서버
pnpm dev:all          # 모든 서비스 동시 실행

# 빌드
pnpm build            # 전체 프로젝트 빌드
pnpm typecheck        # TypeScript 타입 체크
pnpm lint             # ESLint 검사

# 배포
pnpm deploy:cloudflare        # 클라우드플레어 배포
pnpm deploy:cloudflare:staging # 스테이징 배포
```

## 🌐 **배포**

### **자동 배포**
- `main` 브랜치에 푸시하면 자동으로 클라우드플레어 Pages에 배포
- GitHub Actions를 통한 CI/CD 파이프라인

### **수동 배포**
```bash
# 프로덕션 배포
pnpm deploy:cloudflare

# 스테이징 배포
pnpm deploy:cloudflare:staging
```

## 📚 **문서**

- [📖 프로젝트 구조](./docs/PROJECT_STRUCTURE.md)
- [🚀 클라우드플레어 배포 가이드](./docs/CLOUDFLARE_DEPLOYMENT.md)
- [📊 아키텍처 문서](./docs/ARCHITECTURE.md)
- [🛣️ 로드맵](./docs/ROADMAP.md)

## 🤝 **기여하기**

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feat/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feat/AmazingFeature`)
5. Open a Pull Request

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 **연락처**

프로젝트 링크: [https://github.com/velomano/joogo](https://github.com/velomano/joogo)

---

⭐ **이 프로젝트가 도움이 되었다면 스타를 눌러주세요!**

# Test deployment with API keys - Sun Aug 31 22:59:45 KST 2025
# Test deployment with corrected API keys - Sun Aug 31 23:33:03 KST 2025
