-- CSV 업로드를 위한 Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'csv-uploads',
  'csv-uploads',
  false,
  10485760, -- 10MB 제한
  ARRAY['text/csv', 'application/csv', 'text/plain']
) ON CONFLICT (id) DO NOTHING;

-- RLS 정책 설정
CREATE POLICY "Users can upload CSV files to their tenant folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'csv-uploads' AND 
    (storage.foldername(name))[1] = current_setting('app.tenant_id', true)::TEXT
  );

CREATE POLICY "Users can view CSV files in their tenant folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'csv-uploads' AND 
    (storage.foldername(name))[1] = current_setting('app.tenant_id', true)::TEXT
  );

CREATE POLICY "Users can delete CSV files in their tenant folder" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'csv-uploads' AND 
    (storage.foldername(name))[1] = current_setting('app.tenant_id', true)::TEXT
  );
