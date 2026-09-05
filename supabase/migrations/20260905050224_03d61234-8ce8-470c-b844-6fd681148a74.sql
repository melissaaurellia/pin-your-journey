-- 1. Lock down base tables: remove public read, owners read their own rows
DROP POLICY "Places are publicly viewable" ON public.places;
REVOKE SELECT ON public.places FROM anon;
CREATE POLICY "Owners can read their places" ON public.places FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY "Photos are publicly viewable" ON public.place_photos;
REVOKE SELECT ON public.place_photos FROM anon;
CREATE POLICY "Owners can read their photos" ON public.place_photos FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Public safe views (no user_id, no internal metadata beyond what's shown on the map)
CREATE OR REPLACE VIEW public.public_places AS
SELECT id, name, google_place_id, address, city, country, lat, lng, rating, price_level, tags, note, visited_on, created_at
FROM public.places;
GRANT SELECT ON public.public_places TO anon, authenticated;
GRANT ALL ON public.public_places TO service_role;

CREATE OR REPLACE VIEW public.public_place_photos AS
SELECT id, place_id, storage_path, position, created_at
FROM public.place_photos;
GRANT SELECT ON public.public_place_photos TO anon, authenticated;
GRANT ALL ON public.public_place_photos TO service_role;

-- 3. Photos bucket: no more anonymous reads; server signs URLs instead
DROP POLICY "Place photos are readable" ON storage.objects;