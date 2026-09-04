import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const placeInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  googlePlaceId: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  lat: z.number(),
  lng: z.number(),
  rating: z.number().min(0).max(10).nullable().optional(),
  priceLevel: z.number().int().min(1).max(4).nullable().optional(),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  note: z.string().max(4000).nullable().optional(),
  visitedOn: z.string().nullable().optional(),
  photoPaths: z.array(z.string().min(1)).max(12).default([]),
});

export type PlaceInput = z.infer<typeof placeInput>;

export const searchPlaceSuggestions = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ query: z.string().min(2).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { searchPlaces } = await import("./google-places.server");
    try {
      return { suggestions: await searchPlaces(data.query), error: null };
    } catch (error) {
      console.error("Place search failed", error);
      return {
        suggestions: [],
        error: error instanceof Error ? error.message : "Search failed",
      };
    }
  });

export const listMyPlaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("places")
      .select("*, place_photos(id, storage_path, position)")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyPlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: place, error } = await context.supabase
      .from("places")
      .select("*, place_photos(id, storage_path, position)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return place;
  });

export const savePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => placeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const row = {
      user_id: userId,
      name: data.name,
      google_place_id: data.googlePlaceId ?? null,
      address: data.address ?? null,
      city: data.city ?? null,
      country: data.country ?? null,
      lat: data.lat,
      lng: data.lng,
      rating: data.rating ?? null,
      price_level: data.priceLevel ?? null,
      tags: data.tags,
      note: data.note ?? null,
      visited_on: data.visitedOn || null,
    };

    let placeId = data.id;

    if (placeId) {
      const { error } = await supabase
        .from("places")
        .update(row)
        .eq("id", placeId)
        .eq("user_id", userId);
      if (error) throw new Error(error.message);
      await supabase.from("place_photos").delete().eq("place_id", placeId).eq("user_id", userId);
    } else {
      const { data: inserted, error } = await supabase
        .from("places")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      placeId = inserted.id;
    }

    if (data.photoPaths.length > 0) {
      const { error } = await supabase.from("place_photos").insert(
        data.photoPaths.map((path, index) => ({
          place_id: placeId!,
          user_id: userId,
          storage_path: path,
          position: index,
        })),
      );
      if (error) throw new Error(error.message);
    }

    return { id: placeId! };
  });

export const deletePlace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("places")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
