# Supabase Playbook — Joogo MVP Board

**목적**: 업로드 → 스테이징 → 머지 → 전 페이지 자동 동기화까지, DEV/PROD 모두 일관되게 운영하기 위한 실전 가이드. 매번 반복되는 함정(REST 스키마 캐시, RLS, Realtime, StrictMode, 캐시 무효화)을 한 문서로 정리.

## 0) Golden Rules (늘 맞는 4가지)

1. **모든 데이터는 RPC로** (테이블 직접 SELECT 대신).
2. **public 래퍼 + 권한(grant execute)** → 끝나면 항상 `pg_notify('pgrst','reload schema')`.
3. **테넌트는 함수 안에서 해결**: `analytics.current_tenant_id()` 또는 `p_tenant` 인자(혼용 금지).
4. **실시간은 버전 테이블 1개로**: `analytics.data_version` 업데이트만 신호로 삼기.

## 1) 환경 변수 & FE 기본값

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE` (서버/워커/관리 API만)
- `(DEV) NEXT_PUBLIC_DEV_REALTIME_FALLBACK=true` → 인증 세션 없어도 구독 허용(정책과 함께)
- `(DEV) reactStrictMode:false` 권장(Next dev 이중 마운트로 인한 즉시 구독 해제 방지)

### Supabase 브라우저 싱글톤

```typescript
// src/lib/supabaseBrowser.ts
import { createClient } from '@supabase/supabase-js';
let client:any=null;
export function getSupabaseBrowser(){
  if(client) return client;
  client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{
    auth:{ persistSession:true, autoRefreshToken:true, storageKey:'sb-joogo' },
    realtime:{ params:{ eventsPerSecond:5 } }
  });
  return client;
}
```

### 전역 버전 스토어 (SWR 키/라우트 버스터로 사용)

```typescript
// src/lib/versionStore.ts
import { useSyncExternalStore } from 'react';
let v=1; const ls=new Set<()=>void>();
export function bumpVersion(){ v++; ls.forEach(f=>f()); }
export function useDataVersion(){ return useSyncExternalStore(cb=>{ls.add(cb); return()=>ls.delete(cb)}, ()=>v, ()=>v); }
```

### 통일된 RPC 훅

```typescript
// src/lib/useRpc.ts
import useSWR from 'swr';
import { getSupabaseBrowser } from './supabaseBrowser';
import { useDataVersion } from './versionStore';
const supa=getSupabaseBrowser();
export function useRpc(name:string,args:any,keyParts:any[]=[]){
  const v=useDataVersion();
  const key=['rpc',name,v,...keyParts, JSON.stringify(args??{})];
  return useSWR(key, async()=>{
    const {data,error}=await supa.rpc(name,args??{}); if(error) throw error; return data;
  },{ revalidateOnFocus:false, revalidateOnReconnect:true });
}
```

## 2) DB 스키마 (analytics)

### 2.1 current_tenant_id()

```sql
create schema if not exists analytics;
grant usage on schema analytics to anon, authenticated, service_role;

create or replace function analytics.current_tenant_id()
returns uuid language plpgsql stable security definer as $$
declare t_txt text; j jsonb; mapped uuid;
begin
  -- (A) 세션 강제/관리 경로
  t_txt := current_setting('app.tenant_id', true); if t_txt is not null and t_txt<>'' then return t_txt::uuid; end if;
  -- (B) JWT 클레임
  j := nullif(current_setting('request.jwt.claims', true),'')::jsonb;
  if j ? 'tenant_id' then t_txt := j->>'tenant_id'; if t_txt is not null and t_txt<>'' then return t_txt::uuid; end if; end if;
  -- (C) 매핑 테이블 존재 시
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='user_tenants' and c.relkind='r') then
    select ut.tenant_id into mapped from public.user_tenants ut where ut.user_id=auth.uid() limit 1; if mapped is not null then return mapped; end if;
  end if;
  return null; -- DEV는 정책(coalesce)로 강제
end; $$;

grant execute on function analytics.current_tenant_id() to anon, authenticated, service_role;

create or replace function public.set_local_tenant_id(p_tenant uuid)
returns void language sql security definer as $$ select set_config('app.tenant_id', p_tenant::text, true) $$;
grant execute on function public.set_local_tenant_id(uuid) to service_role;
```

### 2.2 버전/작업 테이블 & 정책

```sql
create table if not exists analytics.data_version(
  tenant_id uuid primary key,
  v bigint not null default 1,
  updated_at timestamptz not null default now()
);
create table if not exists analytics.ingest_jobs(
  tenant_id uuid not null,
  file_id uuid not null,
  status text not null check (status in ('uploading','staging','merging','merged','failed')),
  rows_staged int default 0,
  rows_merged int default 0,
  message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key(tenant_id,file_id)
);

alter table analytics.data_version enable row level security;
alter table analytics.ingest_jobs enable row level security;

-- PROD 정책(DEV에서는 아래 4.3 참고)
drop policy if exists dv_sel on analytics.data_version;
create policy dv_sel on analytics.data_version for select to authenticated using (tenant_id = analytics.current_tenant_id());

drop policy if exists ij_sel on analytics.ingest_jobs;
create policy ij_sel on analytics.ingest_jobs for select to authenticated using (tenant_id = analytics.current_tenant_id());

grant select on analytics.data_version, analytics.ingest_jobs to authenticated;
grant insert, update on analytics.data_version, analytics.ingest_jobs to service_role;
```

### 2.3 버전 증가 & Realtime publication

```sql
create or replace function analytics.bump_data_version(p_tenant uuid)
returns bigint language plpgsql security definer as $$
declare newv bigint; begin
  insert into analytics.data_version(tenant_id,v) values (p_tenant,1)
  on conflict(tenant_id) do update set v=analytics.data_version.v+1, updated_at=now()
  returning v into newv; return newv; end; $$;

grant execute on function analytics.bump_data_version(uuid) to service_role;

-- Realtime 게시 등록
do $$ begin
  if not exists (select 1 from pg_publication where pubname='supabase_realtime') then execute 'create publication supabase_realtime'; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='analytics' and tablename='data_version')
    then execute 'alter publication supabase_realtime add table analytics.data_version'; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='analytics' and tablename='ingest_jobs')
    then execute 'alter publication supabase_realtime add table analytics.ingest_jobs'; end if; end $$;

alter table analytics.data_version replica identity full;
alter table analytics.ingest_jobs replica identity full;

select pg_notify('pgrst','reload schema');
```

## 3) RPC 래퍼(public → analytics)

404(PGRST202) 방지: REST가 보는 public 스키마에 동일 이름의 래퍼를 둔다.

```sql
-- 예: 보드 일자별 핵심
create or replace function public.board_sales_daily(
  p_from date default null,
  p_to date default null,
  p_region text[] default null,
  p_channel text[] default null,
  p_category text[] default null,
  p_sku text[] default null
) returns table(date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int)
language sql stable security definer as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(p_from,p_to,p_region,p_channel,p_category,p_sku)
$$;

-- 0-인자 폴백(클라이언트가 args 누락해도 동작)
create or replace function public.board_sales_daily()
returns table(date date, qty numeric, revenue numeric, spend numeric, roas numeric, tavg numeric, is_event int)
language sql stable security definer as $$
  select date, qty, revenue, spend, roas, tavg, is_event
  from analytics.board_sales_daily(null,null,null,null,null,null)
$$;

grant execute on function public.board_sales_daily() to anon, authenticated;
grant execute on function public.board_sales_daily(date,date,text[],text[],text[],text[]) to anon, authenticated;

select pg_notify('pgrst','reload schema');
```

### 클라이언트 호출 규칙

```typescript
supa.rpc('board_sales_daily',{
  p_from: from ?? null,
  p_to: to ?? null,
  p_region: regions?.length? regions:null,
  p_channel: channels?.length? channels:null,
  p_category: categories?.length? categories:null,
  p_sku: skus?.length? skus:null,
});
```

**스키마 접두어 금지**(`public.` X), 항상 args 객체 전달.

## 4) Realtime 구독 전략

### 4.1 전역 브리지 컴포넌트

```typescript
// app/ingest-bridge.tsx
'use client';
import { useEffect, useRef } from 'react';
import { getSupabaseBrowser } from '@/src/lib/supabaseBrowser';
import { bumpVersion } from '@/src/lib/versionStore';
import { useRouter } from 'next/navigation';

let channels:{jobs?:any; ver?:any}={};

export default function IngestBridge({ tenantId }:{tenantId:string}){
  const supa=getSupabaseBrowser();
  const router=useRouter();
  const started=useRef(false);

  useEffect(()=>{
    if(!tenantId||started.current) return; started.current=true;
    let cancelled=false;
    (async()=>{
      const { data:{ session } } = await supa.auth.getSession();
      if(!session && process.env.NEXT_PUBLIC_DEV_REALTIME_FALLBACK!=='true'){ console.warn('[ingest] no session; skip'); return; }
      if(cancelled) return;
      channels.jobs = supa.channel(`jobs:${tenantId}`).on('postgres_changes',{
        event:'*', schema:'analytics', table:'ingest_jobs', filter:`tenant_id=eq.${tenantId}`
      }, async (p)=>{ const row:any=p.new||p.old||{}; if(row.status==='merged'){ bumpVersion(); router.refresh(); } }).subscribe();
      channels.ver = supa.channel(`ver:${tenantId}`).on('postgres_changes',{
        event:'UPDATE', schema:'analytics', table:'data_version', filter:`tenant_id=eq.${tenantId}`
      }, async()=>{ bumpVersion(); router.refresh(); }).subscribe();
    })();
    const off=()=>{ if(channels.jobs) supa.removeChannel(channels.jobs); if(channels.ver) supa.removeChannel(channels.ver); channels={}; started.current=false; };
    window.addEventListener('pagehide',off); window.addEventListener('beforeunload',off);
    return ()=>{ cancelled=true; window.removeEventListener('pagehide',off); window.removeEventListener('beforeunload',off); };
  },[tenantId]);
  return null;
}
```

### 4.2 DEV 폴백 정책(선택)

```sql
-- DEV ONLY: 익명도 읽기 허용 + coalesce로 DEV 테넌트 강제
grant select on analytics.data_version, analytics.ingest_jobs to anon;

drop policy if exists dv_sel on analytics.data_version;
create policy dv_sel on analytics.data_version for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'));

drop policy if exists ij_sel on analytics.ingest_jobs;
create policy ij_sel on analytics.ingest_jobs for select to public
using (tenant_id = coalesce(analytics.current_tenant_id(), '00000000-0000-0000-0000-000000000001'));

select pg_notify('pgrst','reload schema');
```

**운영 전환 시** 위 정책을 원복하고 `to authenticated using (tenant_id = analytics.current_tenant_id())`로 되돌린다.

## 5) 워커/머지 파이프라인 규약

1. **업로드 시작**: `ingest_jobs upsert {status:'uploading'}`
2. **스테이징**: `{status:'staging', rows_staged}`
3. **머지 직전**: `{status:'merging'}`
4. **머지 트랜잭션 끝**:
   ```sql
   perform analytics.bump_data_version(p_tenant);
   update analytics.ingest_jobs set status='merged', rows_merged=... where tenant_id=p_tenant and file_id=p_file;
   ```

### 서비스 키 전용 래퍼

```sql
create or replace function public.merge_for_tenant(p_tenant uuid, p_file uuid)
returns void language plpgsql security definer as $$
begin
  perform public.set_local_tenant_id(p_tenant);
  perform analytics.merge_stage_to_fact(p_tenant, p_file); -- 실제 머지 함수명에 맞게 수정
  perform analytics.bump_data_version(p_tenant);
  update analytics.ingest_jobs set status='merged', rows_merged=(select count(*) from analytics.fact_sales where tenant_id=p_tenant and file_id=p_file), updated_at=now()
  where tenant_id=p_tenant and file_id=p_file;
end; $$;

grant execute on function public.merge_for_tenant(uuid,uuid) to service_role;
```

## 6) 라우트 핸들러 & 캐시 무효화

- `export const runtime='nodejs'` + `export const dynamic='force-dynamic'`
- 응답 헤더: `{ 'cache-control':'no-store, no-cache, must-revalidate' }`
- 클라이언트는 `useDataVersion()`을 키에 포함하거나 `?v=${v}` 쿼리로 버전 버스터 추가

## 7) 헬스체크 & 스모크 테스트

```sql
-- A. PostgREST 캐시 갱신
select pg_notify('pgrst','reload schema');

-- B. public RPC 노출 확인
select routine_schema, routine_name from information_schema.routines where routine_schema='public';

-- C. publication/replica identity
select schemaname, tablename from pg_publication_tables where pubname='supabase_realtime';
select relname, relreplident from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='analytics' and relname in ('data_version','ingest_jobs');

-- D. RLS 정책
select * from pg_policies where schemaname='analytics' and tablename in ('data_version','ingest_jobs');

-- E. bump → 브라우저 자동 갱신 확인
select analytics.bump_data_version('00000000-0000-0000-0000-000000000001');
```

**프런트 콘솔/네트워크:**
- `POST /rest/v1/rpc/board_sales_daily` 200 응답 여부
- `[ingest]` 로그와 함께 자동 리프레시 발생 여부

## 8) 트러블슈팅 의사결정 트리

- **404(PGRST202)**: public 래퍼 존재? grant execute? `pg_notify('pgrst','reload schema')` 했는가?
- **200인데 0행**: RLS 정책/`current_tenant_id()` null? (DEV면 coalesce, PROD면 매핑/JWT)
- **bump해도 무반응**:
  - publication/replica identity 확인
  - 인증 세션 없이 구독? (세션 대기 후 구독 / DEV 폴백)
  - StrictMode에서 언마운트 즉시 removeChannel 했는가?
- **업로드 반영 지연**: 머지 트랜잭션 끝에서 `bump_data_version`/`ingest_jobs='merged'` 호출 누락

## 9) 운영 전환 체크리스트

- [ ] DEV 폴백 정책 제거
- [ ] `reactStrictMode: true` 복원
- [ ] JWT 커스텀 클레임 또는 `user_tenants` 매핑 테이블 구성
- [ ] `NEXT_PUBLIC_DEV_REALTIME_FALLBACK` 제거

## 10) 부록: 자주 쓰는 스니펫

### RPC 래퍼 템플릿

```sql
create or replace function public.<name>(...)
returns table(...) language sql stable security definer as $$
  select * from analytics.<name>(...)
$$; grant execute on function public.<name>(...) to anon, authenticated; select pg_notify('pgrst','reload schema');
```

### DEV 강제 테넌트(세션 한정)

```sql
select set_config('app.force_tenant_id','00000000-0000-0000-0000-000000000001', true);
select analytics.current_tenant_id();
```

### 빠른 리셋-시드-스모크(가이드)

1. 강력 리셋 API 호출
2. 샘플 업로드 (CSV → stage)
3. `rpc public.merge_for_tenant` 호출
4. `select analytics.bump_data_version('<tenant>')`

## Glossary

- **RLS**: Row Level Security. 테넌트 분리 핵심.
- **PostgREST**: Supabase REST 레이어. 스키마 캐시 있음.
- **Publication**: Realtime 송신 대상 테이블 목록.
- **Replica identity full**: UPDATE에서 전체 행을 보내도록 강제.
- **StrictMode**: Next dev에서 이펙트 mount/unmount 두 번 실행.

---

이 문서는 실제 프로젝트에서 겪은 이슈 중심으로 구성되었습니다. 팀 합류자의 온보딩 문서로도 사용 가능합니다.
