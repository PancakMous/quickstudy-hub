CREATE TABLE public.study_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT 'History',
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, DELETE ON public.study_materials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_materials TO authenticated;
GRANT ALL ON public.study_materials TO service_role;

ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view study materials" ON public.study_materials FOR SELECT USING (true);
CREATE POLICY "Anyone can add study materials" ON public.study_materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can remove study materials" ON public.study_materials FOR DELETE USING (true);

CREATE POLICY "Anyone can read study pdfs" ON storage.objects FOR SELECT USING (bucket_id = 'study-pdfs');
CREATE POLICY "Anyone can upload study pdfs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'study-pdfs');
CREATE POLICY "Anyone can delete study pdfs" ON storage.objects FOR DELETE USING (bucket_id = 'study-pdfs');