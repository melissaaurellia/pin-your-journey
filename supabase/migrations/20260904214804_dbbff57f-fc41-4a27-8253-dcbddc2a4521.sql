CREATE TABLE public.places (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  google_place_id TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  rating NUMERIC(3,1) CHECK (rating >= 0 AND rating <= 10),
  price_level SMALLINT CHECK (price_level >= 1 AND price_level <= 4),
  tags TEXT[] NOT NULL DEFAULT '{}',
  note TEXT,
  visited_on DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX places_user_id_idx ON public.places(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.places TO authenticated;
GRANT SELECT ON public.places TO anon;
GRANT ALL ON public.places TO service_role;

ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Places are publicly viewable" ON public.places FOR SELECT USING (true);
CREATE POLICY "Owners can insert their places" ON public.places FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their places" ON public.places FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their places" ON public.places FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.place_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  place_id UUID NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX place_photos_place_id_idx ON public.place_photos(place_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.place_photos TO authenticated;
GRANT SELECT ON public.place_photos TO anon;
GRANT ALL ON public.place_photos TO service_role;

ALTER TABLE public.place_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos are publicly viewable" ON public.place_photos FOR SELECT USING (true);
CREATE POLICY "Owners can insert their photos" ON public.place_photos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their photos" ON public.place_photos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can delete their photos" ON public.place_photos FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_places_updated_at BEFORE UPDATE ON public.places
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Place photos are readable" ON storage.objects FOR SELECT USING (bucket_id = 'place-photos');
CREATE POLICY "Owners can upload place photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can update place photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owners can delete place photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'place-photos' AND auth.uid()::text = (storage.foldername(name))[1]);