# Architecture Overview

## 전체 개요
- **Backend**: Supabase (Postgres + RLS), Microservices (files, catalog, orders, shipping)
- **Frontend**: Next.js 기반 웹 어드민 (npm dev:web)
- **Mobile**: Expo 기반 PDA/스마트폰 스캔앱
- **Admin Tools**: Retool 대시보드

## 주요 흐름
1. CSV 업로드 → Items/Orders DB 반영
2. PDA/Expo 스캔 → 바코드 기반 입고/이동/출고 기록
3. Web Admin → 사용자/재고 관리, KPI/리포트 확인
4. Retool → 테넌트별 관리/분석

## DB 주요 테이블
- `items`: 상품 정보, 재고량, 바코드
- `orders`: 주문 내역
- `memberships`: user/tenant 관계
- `movements`: 입고/출고/이동 로그

---

## Monorepo
- pnpm workspaces (추후 npm 전환 반영)
- turbo for orchestrating builds/dev

## Apps
- `apps/web-admin`: Next.js 15, App Router, TypeScript, Tailwind CSS
  - Pages: /sign-in, /catalog, /orders, /orders/[id], /shipping
  - lib: `mcpClient.ts`, `env.ts`

## Packages
- `@joogo/shared`: Zod schemas, utilities
- `@joogo/mcp-files`: CSV intake → Supabase stage tables
- `@joogo/mcp-catalog`: import/list/upsert products
- `@joogo/mcp-orders`: import/list, mock sync
- `@joogo/mcp-shipping`: create shipment, render label (PDF), print mock

## Supabase
- Schemas: `core`, `ops`
- Extensions: uuid-ossp, pgcrypto
- RLS: `current_tenant_id()` with `current_setting('app.tenant_id')`

## Security
- Providers: Bearer DEV_TOKEN
- Web: NEXT_PUBLIC_* only (no service role in browser)

## Local Dev
- .env at repo root
- Scripts: dev:providers, dev:web, dev:all

## Observability
- Health endpoints: /health for each provider
- Logging: pino (pretty transport in dev)
