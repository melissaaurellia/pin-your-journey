CREATE POLICY "No direct access to reactions"
ON public.place_reactions
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No direct access to comments"
ON public.place_comments
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);