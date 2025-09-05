-- Create public.tenants table for Supabase API access
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a view that mirrors core.tenants
CREATE OR REPLACE VIEW public.tenants_view AS
SELECT id, name, created_at
FROM core.tenants;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated, service_role;
GRANT SELECT ON public.tenants_view TO authenticated, service_role;

-- Create RPC function to sync tenants from core to public
CREATE OR REPLACE FUNCTION public.sync_tenants()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sync_count INTEGER := 0;
BEGIN
  -- Insert tenants from core.tenants that don't exist in public.tenants
  INSERT INTO public.tenants (id, name, created_at)
  SELECT c.id, c.name, c.created_at
  FROM core.tenants c
  LEFT JOIN public.tenants p ON c.id = p.id
  WHERE p.id IS NULL;
  
  GET DIAGNOSTICS sync_count = ROW_COUNT;
  
  -- Update existing tenants
  UPDATE public.tenants 
  SET name = c.name, created_at = c.created_at
  FROM core.tenants c
  WHERE public.tenants.id = c.id;
  
  RETURN sync_count;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.sync_tenants() TO authenticated, service_role;

-- Create trigger to automatically sync when core.tenants changes
CREATE OR REPLACE FUNCTION public.trigger_sync_tenants()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.tenants (id, name, created_at)
    VALUES (NEW.id, NEW.name, NEW.created_at);
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE public.tenants 
    SET name = NEW.name, created_at = NEW.created_at
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM public.tenants WHERE id = OLD.id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS sync_tenants_trigger ON core.tenants;
CREATE TRIGGER sync_tenants_trigger
  AFTER INSERT OR UPDATE OR DELETE ON core.tenants
  FOR EACH ROW EXECUTE FUNCTION public.trigger_sync_tenants();

-- Initial sync
SELECT public.sync_tenants();
