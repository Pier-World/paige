-- profile-photos bucket: public read for getPublicUrl(); authenticated uploads under profile-photos/{uid}-*.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = COALESCE(EXCLUDED.file_size_limit, storage.buckets.file_size_limit),
  allowed_mime_types = COALESCE(EXCLUDED.allowed_mime_types, storage.buckets.allowed_mime_types);

DROP POLICY IF EXISTS "Public read profile photos" ON storage.objects;
CREATE POLICY "Public read profile photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

DROP POLICY IF EXISTS "Authenticated insert profile photos" ON storage.objects;
CREATE POLICY "Authenticated insert profile photos"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = 'profile-photos'
    AND split_part(name, '/', 2) LIKE (auth.uid()::text || '-%')
  );

DROP POLICY IF EXISTS "Authenticated update profile photos" ON storage.objects;
CREATE POLICY "Authenticated update profile photos"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = 'profile-photos'
    AND split_part(name, '/', 2) LIKE (auth.uid()::text || '-%')
  )
  WITH CHECK (
    bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = 'profile-photos'
    AND split_part(name, '/', 2) LIKE (auth.uid()::text || '-%')
  );

DROP POLICY IF EXISTS "Authenticated delete profile photos" ON storage.objects;
CREATE POLICY "Authenticated delete profile photos"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'profile-photos'
    AND split_part(name, '/', 1) = 'profile-photos'
    AND split_part(name, '/', 2) LIKE (auth.uid()::text || '-%')
  );
