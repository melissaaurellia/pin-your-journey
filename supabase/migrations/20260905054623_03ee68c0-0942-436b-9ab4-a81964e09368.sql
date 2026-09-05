CREATE TABLE public.place_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  visitor_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (place_id, visitor_id)
);

GRANT ALL ON public.place_reactions TO service_role;
ALTER TABLE public.place_reactions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.place_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id uuid NOT NULL REFERENCES public.places(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.place_comments TO service_role;
ALTER TABLE public.place_comments ENABLE ROW LEVEL SECURITY;

CREATE INDEX place_comments_place_id_created_at_idx ON public.place_comments (place_id, created_at DESC);
CREATE INDEX place_reactions_place_id_idx ON public.place_reactions (place_id);