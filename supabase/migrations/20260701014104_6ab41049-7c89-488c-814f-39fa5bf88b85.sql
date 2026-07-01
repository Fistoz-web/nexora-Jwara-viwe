
CREATE POLICY "Own uploads read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'research-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Own uploads insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'research-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Own uploads delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'research-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
