-- Helper function to get current tenant ID from session
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.tenant_id', true)::UUID;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS 정책을 여러 번 적용해도 에러나지 않도록 기존 정책 삭제
-- === core.products ===========================================================
alter table core.products enable row level security;

drop policy if exists "products select own" on core.products;
drop policy if exists "products insert own" on core.products;
drop policy if exists "products update own" on core.products;
drop policy if exists "products delete own" on core.products;

create policy "products select own"
on core.products for select
using (tenant_id = current_tenant_id());

create policy "products insert own"
on core.products for insert
with check (tenant_id = current_tenant_id());

create policy "products update own"
on core.products for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "products delete own"
on core.products for delete
using (tenant_id = current_tenant_id());

-- === core.orders =============================================================
alter table core.orders enable row level security;

drop policy if exists "orders select own" on core.orders;
drop policy if exists "orders insert own" on core.orders;
drop policy if exists "orders update own" on core.orders;
drop policy if exists "orders delete own" on core.orders;

create policy "orders select own"
on core.orders for select
using (tenant_id = current_tenant_id());

create policy "orders insert own"
on core.orders for insert
with check (tenant_id = current_tenant_id());

create policy "orders update own"
on core.orders for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "orders delete own"
on core.orders for delete
using (tenant_id = current_tenant_id());

-- === core.order_items ========================================================
alter table core.order_items enable row level security;

drop policy if exists "order_items select own" on core.order_items;
drop policy if exists "order_items insert own" on core.order_items;
drop policy if exists "order_items update own" on core.order_items;
drop policy if exists "order_items delete own" on core.order_items;

create policy "order_items select own"
on core.order_items for select
using (exists (
  select 1 from core.orders o
  where o.id = order_id
  and o.tenant_id = current_tenant_id()
));

create policy "order_items insert own"
on core.order_items for insert
with check (exists (
  select 1 from core.orders o
  where o.id = order_id
  and o.tenant_id = current_tenant_id()
));

create policy "order_items update own"
on core.order_items for update
using (exists (
  select 1 from core.orders o
  where o.id = order_id
  and o.tenant_id = current_tenant_id()
))
with check (exists (
  select 1 from core.orders o
  where o.id = order_id
  and o.tenant_id = current_tenant_id()
));

create policy "order_items delete own"
on core.order_items for delete
using (exists (
  select 1 from core.orders o
  where o.id = order_id
  and o.tenant_id = current_tenant_id()
));

-- === core.channels ===========================================================
alter table core.channels enable row level security;

drop policy if exists "channels select own" on core.channels;
drop policy if exists "channels insert own" on core.channels;
drop policy if exists "channels update own" on core.channels;
drop policy if exists "channels delete own" on core.channels;

create policy "channels select own"
on core.channels for select
using (tenant_id = current_tenant_id());

create policy "channels insert own"
on core.channels for insert
with check (tenant_id = current_tenant_id());

create policy "channels update own"
on core.channels for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "channels delete own"
on core.channels for delete
using (tenant_id = current_tenant_id());

-- === core.channel_credentials ===============================================
alter table core.channel_credentials enable row level security;

drop policy if exists "channel_creds select own" on core.channel_credentials;
drop policy if exists "channel_creds insert own" on core.channel_credentials;
drop policy if exists "channel_creds update own" on core.channel_credentials;
drop policy if exists "channel_creds delete own" on core.channel_credentials;

create policy "channel_creds select own"
on core.channel_credentials for select
using (tenant_id = current_tenant_id());

create policy "channel_creds insert own"
on core.channel_credentials for insert
with check (tenant_id = current_tenant_id());

create policy "channel_creds update own"
on core.channel_credentials for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "channel_creds delete own"
on core.channel_credentials for delete
using (tenant_id = current_tenant_id());

-- === core.shipments ==========================================================
alter table core.shipments enable row level security;

drop policy if exists "shipments select own" on core.shipments;
drop policy if exists "shipments insert own" on core.shipments;
drop policy if exists "shipments update own" on core.shipments;
drop policy if exists "shipments delete own" on core.shipments;

create policy "shipments select own"
on core.shipments for select
using (tenant_id = current_tenant_id());

create policy "shipments insert own"
on core.shipments for insert
with check (tenant_id = current_tenant_id());

create policy "shipments update own"
on core.shipments for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "shipments delete own"
on core.shipments for delete
using (tenant_id = current_tenant_id());

-- === core.shipment_items =====================================================
alter table core.shipment_items enable row level security;

drop policy if exists "shipment_items select own" on core.shipment_items;
drop policy if exists "shipment_items insert own" on core.shipment_items;
drop policy if exists "shipment_items update own" on core.shipment_items;
drop policy if exists "shipment_items delete own" on core.shipment_items;

create policy "shipment_items select own"
on core.shipment_items for select
using (exists (
  select 1 from core.shipments s
  where s.id = shipment_id
  and s.tenant_id = current_tenant_id()
));

create policy "shipment_items insert own"
on core.shipment_items for insert
with check (exists (
  select 1 from core.shipments s
  where s.id = shipment_id
  and s.tenant_id = current_tenant_id()
));

create policy "shipment_items update own"
on core.shipment_items for update
using (exists (
  select 1 from core.shipments s
  where s.id = shipment_id
  and s.tenant_id = current_tenant_id()
))
with check (exists (
  select 1 from core.shipments s
  where s.id = shipment_id
  and s.tenant_id = current_tenant_id()
));

create policy "shipment_items delete own"
on core.shipment_items for delete
using (exists (
  select 1 from core.shipments s
  where s.id = shipment_id
  and s.tenant_id = current_tenant_id()
));

-- === stage tables (CSV intake) ===============================================
alter table core.stage_products enable row level security;
alter table core.stage_orders enable row level security;

drop policy if exists "stage_products own" on core.stage_products;
drop policy if exists "stage_orders own" on core.stage_orders;

create policy "stage_products own"
on core.stage_products for all
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "stage_orders own"
on core.stage_orders for all
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

-- === ops.jobs (선택: 잡큐/로그용) ============================================
alter table ops.jobs enable row level security;

drop policy if exists "jobs select own" on ops.jobs;
drop policy if exists "jobs insert own" on ops.jobs;
drop policy if exists "jobs update own" on ops.jobs;
drop policy if exists "jobs delete own" on ops.jobs;

create policy "jobs select own"
on ops.jobs for select
using (tenant_id = current_tenant_id());

create policy "jobs insert own"
on ops.jobs for insert
with check (tenant_id = current_tenant_id());

create policy "jobs update own"
on ops.jobs for update
using (tenant_id = current_tenant_id())
with check (tenant_id = current_tenant_id());

create policy "jobs delete own"
on ops.jobs for delete
using (tenant_id = current_tenant_id());
