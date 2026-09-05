-- Replace views with column-level privileges (clears security-definer-view lint)
DROP VIEW public.public_places;
DROP VIEW public.public_place_photos;

-- places: public map columns only, account ID stays hidden
CREATE POLICY "Public can view map places" ON public.places FOR SELECT TO anon USING (true);
GRANT SELECT (id, name, google_place_id, address, city, country, lat, lng, rating, price_level, tags, note, visited_on, created_at) ON public.places TO anon;

-- place_photos: no public access at all; server signs photo URLs with the service role
-- (owner authenticated read/write policies already exist)