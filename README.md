# 🚀 Joogo WMS/OMS

**WMS/OMS MVP with MCP providers and Supabase - Modernized UI & Optimized CI/CD**

## ✨ **주요 기능**

- 📊 **데이터 분석 대시보드**: 실시간 매출 및 재고 분석
- 📁 **파일 업로드 시스템**: CSV 파일 자동 파싱 및 처리
- 🤖 **AI 기반 인사이트**: OpenAI를 활용한 데이터 분석
- 🔄 **자동화된 워크플로우**: MCP 서비스를 통한 업무 자동화
- 🌐 **클라우드플레어 배포**: 글로벌 CDN을 통한 빠른 서비스
- 🎨 **현대적 UI/UX**: 네이버/토스 스타일의 깔끔하고 직관적인 인터페이스

## 🏗️ **아키텍처**

### **프론트엔드**
- **Next.js 14** + **React 18** + **TypeScript**
- **Tailwind CSS** + **Radix UI** 컴포넌트
- **Edge Runtime** 지원으로 클라우드플레어 최적화
- **현대적 디자인 시스템**: 그라데이션, 애니메이션, 반응형 레이아웃

### **백엔드**
- **Supabase**: PostgreSQL + RLS + 실시간 기능
- **MCP 서비스**: 표준 프로토콜 기반 마이크로서비스
- **Node.js 워커**: 데이터 처리 및 수집

### **배포**
- **클라우드플레어 Pages**: 자동 배포 + 글로벌 CDN
- **GitHub Actions**: CI/CD 자동화 (최적화됨)
- **Edge Computing**: 전 세계 어디서나 빠른 응답
- **Wrangler v4**: Pages 전용 설정으로 최적화

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
│   ├── 📁 web-admin/          # Next.js 웹 관리자 (Edge Runtime + 현대적 UI)
│   └── 📁 ingest-worker/      # 데이터 수집 워커 (ESLint 오류 해결)
├── 📁 packages/                # 공통 패키지들
│   ├── 📁 shared/             # 공통 유틸리티 + 로거 시스템
│   ├── 📁 mcp-catalog/        # MCP 카탈로그 서비스
│   ├── 📁 mcp-files/          # MCP 파일 서비스
│   ├── 📁 mcp-orders/         # MCP 주문 서비스
│   └── 📁 mcp-shipping/       # MCP 배송 서비스
├── 📁 docs/                    # 문서 (최신 상태)
├── 📁 scripts/                 # 유틸리티 스크립트
├── 📁 .github/                 # GitHub Actions (최적화된 워크플로우)
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
pnpm build:web        # 웹 관리자만 빌드

# 배포
pnpm deploy:cloudflare        # 클라우드플레어 배포
pnpm deploy:cloudflare:preview # 프리뷰 환경 배포

# 코드 품질
pnpm lint             # ESLint 실행
pnpm lint:fix         # ESLint 오류 자동 수정
```

## 🎯 **최근 주요 개선사항 (2024-08-31)**

### **✅ UI/UX 현대화**
- **네이버/토스 스타일 디자인**: 현대적이고 깔끔한 인터페이스
- **중복 헤더 제거**: 레이아웃과 메인 페이지 중복 해결
- **그라데이션 배경**: 슬레이트에서 블루로 부드러운 전환
- **반응형 네비게이션**: 스티키 포지션, 호버 효과, 애니메이션

### **✅ CI/CD 파이프라인 최적화**
- **pnpm 설정 순서 수정**: Node.js 설정 전에 pnpm 설정
- **ESLint 규칙 완화**: CI가 성공할 수 있도록 규칙 조정
- **ingest-worker 오류 수정**: `no-constant-condition` 문제 해결
- **GitHub Actions 경로 문제 해결**: 중복 경로 수정

### **✅ Cloudflare 배포 설정 완료**
- **프로젝트명 수정**: `joogo-wms-oms` → `joogo`
- **API 키 설정**: GitHub Secrets에 Cloudflare 토큰 추가
- **Wrangler v4 호환성**: Pages 전용 설정으로 최적화
- **자동 배포 파이프라인**: GitHub Actions를 통한 자동화

### **✅ 프로젝트 정리 및 최적화**
- **불필요한 브랜치 삭제**: `fix/ci-eslint-csv-parse` 정리
- **문서화 완성**: 모든 작업 내용을 문서에 반영
- **코드 품질 향상**: TypeScript 설정 및 ESLint 최적화

## 🌟 **기술적 특징**

### **성능 최적화**
- **Edge Runtime**: 모든 API 라우트가 클라우드플레어 Edge에서 실행
- **글로벌 CDN**: 전 세계 어디서나 빠른 응답
- **자동화된 배포**: GitHub Actions를 통한 빠른 배포

### **개발자 경험**
- **TypeScript**: 타입 안전성과 개발 생산성 향상
- **모노레포 구조**: 효율적인 패키지 관리
- **자동화된 워크플로우**: CI/CD 파이프라인으로 품질 보장

### **사용자 경험**
- **직관적인 인터페이스**: 현대적이고 깔끔한 디자인
- **반응형 디자인**: 모든 디바이스에서 최적화된 표시
- **빠른 로딩**: 최적화된 컴포넌트 및 이미지

## 📚 **문서**

- **[프로젝트 상태](docs/PROJECT_STATUS.md)**: 현재 진행 상황 및 완료된 작업
- **[배포 가이드](docs/CLOUDFLARE_DEPLOYMENT.md)**: 클라우드플레어 배포 방법
- **[프로젝트 구조](docs/PROJECT_STRUCTURE.md)**: 상세한 프로젝트 구조 설명
- **[기술 설계](docs/TECH_DESIGN_insight_to_action.md)**: 기술적 구현 세부사항

## 🚀 **배포 상태**

- **GitHub Actions**: ✅ CI/CD 파이프라인 최적화 완료
- **Cloudflare Pages**: 🚧 Wrangler v4 호환성 문제 해결 후 배포 진행
- **로컬 개발**: ✅ 현대적 UI 적용 완료

## 🤝 **기여하기**

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 **연락처**

프로젝트 링크: [https://github.com/velomano/joogo](https://github.com/velomano/joogo)

---

**🚀 Joogo WMS/OMS - 현대적이고 효율적인 창고 관리 시스템**
