-- Public read of photo files in the gallery bucket
CREATE POLICY "Place photos are publicly readable" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'place-photos');

-- Public read of the photo listing, without exposing the user_id column
CREATE POLICY "Photos are publicly viewable" ON public.place_photos FOR SELECT TO anon USING (true);
GRANT SELECT (id, place_id, storage_path, position, created_at) ON public.place_photos TO anon;