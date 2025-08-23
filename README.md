# Joogo - WMS/OMS MVP

멀티테넌트 기반의 Warehouse Management System (WMS) 및 Order Management System (OMS) MVP 프로젝트입니다.

## 🚀 주요 기능

### 📊 **판매 분석 시스템 (신규)**
- **새로운 데이터 포맷 지원**: `데이터 분석 - RawData.csv` (95개 컬럼)
- **고급 분석**: 상품별 매출, 원가, 마진, 일별 판매 추이
- **대시보드**: 실시간 통계, 차트 시각화, 필터링
- **API**: 업로드, 조회, 일별 데이터 처리

### 🤖 **AI 기반 자연어 쿼리**
- **토큰 최적화**: 60% 이상 토큰 사용량 감소
- **의도 라우터**: 빠른 의도 파악 (600 토큰 이하)
- **SQL 템플릿**: 미리 정의된 쿼리로 LLM 호출 최소화
- **캐싱**: 반복 질문에 대한 즉시 응답

### 📈 **Sales Analytics Dashboard**
- 월별 매출 추이 및 Top SKU 분석
- 재고 현황 및 CSV 다운로드
- Recharts 기반 동적 차트 렌더링

### 🔍 **Items Management**
- 상품 정보 업로드/관리
- 바코드 스캔 지원
- 재고 현황 모니터링

## 🏗️ 아키텍처

### **데이터베이스 구조**
```
core/
├── items (기존)           # 기본 재고 관리
├── products (신규)        # 상세 상품 정보 (95개 컬럼)
├── daily_sales (신규)     # 일별 판매 데이터
├── product_mapping        # 기존-신규 테이블 매핑
└── sales                 # 매출 데이터
```

### **API 구조**
```
/api/
├── upload/
│   └── sales-analysis    # CSV 업로드 및 처리
├── sales-analysis/       # 메인 판매 분석
│   └── daily            # 일별 데이터
├── analytics/sales       # 기존 매출 분석
├── ask                  # AI 자연어 쿼리
└── items                # 상품 관리
```

### **프론트엔드 페이지**
```
/admin/
├── sales-analysis        # 새로운 판매 분석 대시보드
├── analytics/sales       # 기존 매출 분석
├── ask                  # AI 쿼리 인터페이스
└── items                # 상품 관리
```

## 🛠️ 설치 및 실행

### **필수 요구사항**
- Node.js 18+
- pnpm
- Supabase 프로젝트

### **1. 저장소 클론**
```bash
git clone https://github.com/velomano/joogo.git
cd joogo
```

### **2. 의존성 설치**
```bash
pnpm install
```

### **3. 환경변수 설정**
```bash
# .env.local 파일 생성
cp .env.example .env.local

# Supabase 설정
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE=your_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# OpenAI API (AI 쿼리용)
OPENAI_API_KEY=your_openai_api_key
```

### **4. 데이터베이스 스키마 설정**
```sql
-- Supabase SQL Editor에서 실행
-- database/schema/sales_analysis.sql 파일의 내용을 실행
```

### **5. 개발 서버 실행**
```bash
# 프론트엔드 (Next.js)
cd apps/web-admin
pnpm dev

# 백엔드 (Supabase)
# Supabase Studio에서 Functions 활성화
```

## 📊 **새로운 판매 분석 기능 사용법**

### **1. CSV 파일 업로드**
- `/admin/sales-analysis` 페이지 접속
- `데이터 분석 - RawData.csv` 파일 업로드
- 자동 파싱 및 데이터베이스 저장

### **2. 데이터 분석**
- **요약 카드**: 총 상품 수, 매출, 이익, 재고 상태
- **차트**: 일별 판매 추이, Top 10 상품
- **필터**: 검색, 카테고리별 분류
- **상품 목록**: 상세 정보 및 통계

### **3. API 활용**
```bash
# 업로드
POST /api/upload/sales-analysis
Content-Type: multipart/form-data
file: CSV파일, tenant_id: 테넌트ID

# 데이터 조회
GET /api/sales-analysis?tenant_id=default&limit=100

# 일별 데이터
GET /api/sales-analysis/daily?tenant_id=default&days=30
```

## 🔧 **개발 가이드**

### **새로운 기능 추가**
1. **데이터베이스**: `database/schema/` 폴더에 SQL 스키마 작성
2. **API**: `apps/web-admin/src/app/api/` 폴더에 API 라우트 생성
3. **페이지**: `apps/web-admin/src/app/admin/` 폴더에 React 컴포넌트 생성
4. **문서**: `CHANGELOG.md`에 변경사항 기록

### **코드 스타일**
- TypeScript 사용
- ESLint + Prettier 설정 준수
- 컴포넌트별 타입 정의
- 에러 핸들링 및 로깅

### **테스트**
```bash
# 타입 체크
pnpm typecheck

# 린트
pnpm lint

# 빌드
pnpm build
```

## 📈 **성능 최적화**

### **토큰 사용량 최적화**
- **의도 라우터**: LLM 호출 80% 감소
- **SQL 템플릿**: 미리 정의된 쿼리 활용
- **캐싱**: 반복 질문 즉시 응답
- **스키마 선택**: 최소한의 컨텍스트만 전송

### **데이터베이스 최적화**
- **인덱싱**: 자주 조회되는 컬럼에 인덱스 적용
- **배치 처리**: 100개씩 배치로 데이터 처리
- **RLS**: 테넌트별 데이터 격리 및 보안

## 🚨 **문제 해결**

### **일반적인 오류**
1. **환경변수 누락**: `.env.local` 파일 확인
2. **Supabase 연결 실패**: URL 및 키 확인
3. **타입 오류**: `pnpm typecheck` 실행
4. **빌드 실패**: `pnpm build` 실행하여 오류 확인

### **데이터베이스 문제**
1. **스키마 오류**: `sales_analysis.sql` 재실행
2. **RLS 정책**: 테넌트 설정 확인
3. **함수 오류**: Supabase Functions 재배포

## 📝 **변경 이력**

자세한 변경사항은 [CHANGELOG.md](./CHANGELOG.md)를 참조하세요.

## 🤝 **기여하기**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](./LICENSE) 파일을 참조하세요.

## 📞 **지원**

문제가 발생하거나 질문이 있으시면:
1. [GitHub Issues](https://github.com/velomano/joogo/issues) 생성
2. 프로젝트 문서 확인
3. 개발팀에 문의

---

**Joogo** - 스마트한 창고 및 주문 관리 시스템 🚀

