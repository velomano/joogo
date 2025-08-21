-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS ops;

-- Tenants table
CREATE TABLE core.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE core.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  option TEXT,
  pack_info TEXT,
  image_url TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, sku)
);

-- Items table (for CSV upload stabilization)
CREATE TABLE IF NOT EXISTS core.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  barcode TEXT NOT NULL,
  product_name TEXT NOT NULL,
  qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, barcode)
);

-- Channels table
CREATE TABLE core.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Channel credentials table
CREATE TABLE core.channel_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES core.channels(id) ON DELETE CASCADE,
  credentials_json JSONB NOT NULL,
  refreshed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE core.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES core.channels(id) ON DELETE SET NULL,
  channel_order_no TEXT NOT NULL,
  buyer TEXT NOT NULL,
  ordered_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, channel_id, channel_order_no)
);

-- Order items table
CREATE TABLE core.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES core.orders(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL,
  option TEXT,
  price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipments table
CREATE TABLE core.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES core.orders(id) ON DELETE CASCADE,
  carrier TEXT NOT NULL,
  tracking_no TEXT,
  label_format TEXT DEFAULT 'pdf',
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  printed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipment items table
CREATE TABLE core.shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES core.shipments(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stage tables for CSV intake
CREATE TABLE core.stage_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  barcode TEXT,
  name TEXT NOT NULL,
  option TEXT,
  pack_info TEXT,
  image_url TEXT,
  unit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE core.stage_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  channel_order_no TEXT NOT NULL,
  buyer TEXT NOT NULL,
  ordered_at TIMESTAMPTZ NOT NULL,
  sku TEXT NOT NULL,
  qty INTEGER NOT NULL,
  option TEXT,
  price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Jobs table for tracking operations
CREATE TABLE ops.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES core.tenants(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  data JSONB,
  result JSONB,
  error TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_products_tenant_sku ON core.products(tenant_id, sku);
CREATE INDEX idx_products_barcode ON core.products(barcode);
CREATE INDEX IF NOT EXISTS idx_items_tenant_barcode ON core.items(tenant_id, barcode);

-- Public view for reading items via REST (public schema only)
CREATE OR REPLACE VIEW public.items_view AS
SELECT
  i.tenant_id,
  i.barcode,
  i.product_name,
  i.qty,
  i.created_at AS updated_at
FROM core.items i;

-- Public RPC to list items for a tenant (stable read path)
CREATE OR REPLACE FUNCTION public.list_items(_tenant_id UUID)
RETURNS TABLE (barcode TEXT, product_name TEXT, qty INTEGER, updated_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT i.barcode, i.product_name, i.qty, i.created_at AS updated_at
  FROM core.items i
  WHERE i.tenant_id = _tenant_id
  ORDER BY i.created_at DESC
  LIMIT 100;
$$;

-- Public RPC to reset items by tenant
CREATE OR REPLACE FUNCTION public.reset_items(_tenant_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  DELETE FROM core.items WHERE tenant_id = _tenant_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Public RPC to upsert items into core.items (exposed via PostgREST)
CREATE OR REPLACE FUNCTION public.upsert_items(_items JSONB)
RETURNS TABLE (inserted INTEGER, updated INTEGER, total INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY WITH up AS (
    INSERT INTO core.items (tenant_id, barcode, product_name, qty)
    SELECT
      (elem->>'tenant_id')::UUID,
      elem->>'barcode',
      elem->>'productName',
      COALESCE(NULLIF(elem->>'qty','')::INT, 0)
    FROM jsonb_array_elements(_items) AS elem
    ON CONFLICT (tenant_id, barcode) DO UPDATE
      SET product_name = EXCLUDED.product_name,
          qty = EXCLUDED.qty
    RETURNING xmax
  )
  SELECT
    SUM(CASE WHEN xmax = 0 THEN 1 ELSE 0 END) AS inserted,
    SUM(CASE WHEN xmax <> 0 THEN 1 ELSE 0 END) AS updated,
    COUNT(*) AS total
  FROM up;
END;
$$;
CREATE INDEX idx_orders_tenant_status ON core.orders(tenant_id, status);
CREATE INDEX idx_orders_tenant_channel ON core.orders(tenant_id, channel_id);
CREATE INDEX idx_order_items_order_id ON core.order_items(order_id);
CREATE INDEX idx_shipments_tenant_order ON core.shipments(tenant_id, order_id);
CREATE INDEX idx_stage_products_tenant ON core.stage_products(tenant_id);
CREATE INDEX idx_stage_orders_tenant ON core.stage_orders(tenant_id);
CREATE INDEX idx_jobs_tenant_status ON ops.jobs(tenant_id, status);

