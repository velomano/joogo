-- 사용자 대시보드 레이아웃 저장 테이블
CREATE TABLE IF NOT EXISTS public.user_dashboard_layouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  page VARCHAR(50) NOT NULL, -- 'sales', 'inventory', 'ai', 'help'
  layout JSONB NOT NULL, -- react-grid-layout의 layout 데이터
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, tenant_id, page)
);

-- RLS 정책
ALTER TABLE public.user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 레이아웃만 조회/수정 가능
CREATE POLICY "Users can manage their own dashboard layouts" ON public.user_dashboard_layouts
  FOR ALL USING (auth.uid() = user_id);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_tenant_page 
  ON public.user_dashboard_layouts(user_id, tenant_id, page);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_dashboard_layouts_updated_at 
  BEFORE UPDATE ON public.user_dashboard_layouts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
