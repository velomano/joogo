-- ingest_jobs 테이블 생성
CREATE TABLE IF NOT EXISTS ingest_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  error TEXT,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_tenant_id ON ingest_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_status ON ingest_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ingest_jobs_created_at ON ingest_jobs(created_at);

-- RLS 정책
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;

-- tenant_id 기반 접근 제어
CREATE POLICY "Users can view their own ingest jobs" ON ingest_jobs
  FOR SELECT USING (tenant_id = current_setting('app.tenant_id', true)::TEXT);

CREATE POLICY "Users can insert their own ingest jobs" ON ingest_jobs
  FOR INSERT WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::TEXT);

CREATE POLICY "Users can update their own ingest jobs" ON ingest_jobs
  FOR UPDATE USING (tenant_id = current_setting('app.tenant_id', true)::TEXT);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ingest_jobs_updated_at 
  BEFORE UPDATE ON ingest_jobs 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
