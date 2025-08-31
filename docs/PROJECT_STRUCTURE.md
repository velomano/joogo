# 프로젝트 구조

## 📁 **루트 디렉토리**

```
joogo/
├── 📁 apps/                    # 애플리케이션들
│   ├── 📁 web-admin/          # Next.js 웹 관리자 (메인 앱)
│   └── 📁 ingest-worker/      # 데이터 수집 워커
├── 📁 packages/                # 공통 패키지들
│   ├── 📁 shared/             # 공통 유틸리티 및 타입
│   ├── 📁 mcp-catalog/        # MCP 카탈로그 서비스
│   ├── 📁 mcp-files/          # MCP 파일 서비스
│   ├── 📁 mcp-orders/         # MCP 주문 서비스
│   └── 📁 mcp-shipping/       # MCP 배송 서비스
├── 📁 docs/                    # 문서
├── 📁 scripts/                 # 유틸리티 스크립트
├── 📁 supabase/                # Supabase 설정 및 마이그레이션
├── 📁 database/                # 데이터베이스 스키마
├── 📁 samples/                 # 샘플 데이터 파일들
└── 📁 .github/                 # GitHub Actions 워크플로우
```

## 🚀 **핵심 애플리케이션**

### **web-admin** (Next.js)
- **위치**: `apps/web-admin/`
- **기술**: Next.js 14, React 18, TypeScript
- **배포**: 클라우드플레어 Pages
- **주요 기능**: 
  - 데이터 업로드 및 관리
  - 분석 대시보드
  - AI 기반 인사이트

### **ingest-worker** (Node.js)
- **위치**: `apps/ingest-worker/`
- **기술**: Node.js, TypeScript
- **역할**: CSV 데이터 처리 및 데이터베이스 수집

## 🔧 **공통 패키지**

### **shared**
- 공통 타입 정의
- CSV 파싱 유틸리티
- 데이터 변환 함수

### **MCP 서비스들**
- 각각 독립적인 마이크로서비스
- 표준 MCP 프로토콜 준수
- 인증 및 에러 핸들링 포함

## 📊 **데이터베이스**

### **Supabase**
- PostgreSQL 기반
- RLS (Row Level Security) 적용
- 자동 마이그레이션 관리

## 🚀 **배포 및 CI/CD**

### **클라우드플레어 Pages**
- 자동 배포 (main 브랜치 푸시 시)
- Edge Runtime 지원
- 글로벌 CDN

### **GitHub Actions**
- 자동화된 빌드 및 배포
- 의존성 캐싱
- 에러 처리 및 알림

## 📝 **주요 설정 파일**

- `wrangler.toml`: 클라우드플레어 설정
- `turbo.json`: 모노레포 빌드 설정
- `pnpm-workspace.yaml`: 워크스페이스 설정
- `.github/workflows/`: CI/CD 워크플로우
