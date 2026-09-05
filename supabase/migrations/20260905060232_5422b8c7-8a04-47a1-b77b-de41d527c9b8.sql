CREATE POLICY "Authenticated users can read place photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'place-photos');