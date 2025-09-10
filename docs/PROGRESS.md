# Joogo Project Progress — 2025-09-10

## ✅ Completed
- CSV Upload → Supabase ingestion → Query pipeline.
- `original_data (JSONB)` raw preservation.
- Multi-tenant structure: all rows tagged with `tenant_id`, RLS applied.
- Git workflow: standardized (main branch, feature branches, cleanup).
- UI/UX: inventory list column ordering, detail modal, reset/refresh actions.
- Architecture docs synced (API-first + CSV fallback clarified).
- **Mock Cafe24 Provider**: 개발용 API 서버 추가 (apps/mock-cafe24).

## ⏳ In Progress
- **PR #7: Real-time synchronization**
  - Adds live worker-to-DB updates.
  - Checklist 6/8 completed.
- Multi-tenant auth + role enforcement (Issue #3).
- Health-check API (Issue #1).

## 📅 Next Steps
- Phase2: Analytics Engine
  - Materialized views (monthly sales, top SKU).
  - Incremental refresh functions.
- Phase3: AI Query
  - Intent router + SQL templates (Top-N, MoM growth, safe guardrails).
- Phase4: Action Queue
  - JSONB payload queue.
  - State machine: Draft → Proposed → Approved → Executed (+ Cancelled/Failed).
- **Mock Provider 확장**: Naver/Coupang Mock API 추가
- **ingest-worker 연동**: Mock Provider와 실제 API 간 전환 로직 구현

## 📝 Notes
- Architecture shift: **API-first ingestion, CSV fallback**.
- Inventory quantity field: API-driven stock vs sales-based feed clarified.
- Reminder: Cloudflare Pages env vars must include:
  - `OPENAI_API_KEY` (both Preview/Production).
  - Optionally `OPENAI_BASE_URL`.
- Health-check endpoint should include DB + RLS + Storage check.
- **Mock Provider**: `pnpm --filter @joogo/mock-cafe24 dev`로 로컬 실행 가능.
