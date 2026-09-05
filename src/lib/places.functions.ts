import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicPlace = {
  id: string;
  name: string;
  googlePlaceId: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  priceLevel: number | null;
  tags: string[];
  note: string | null;
  visitedOn: string | null;
  photos: string[];
};

export const listPlaces = createServerFn({ method: "GET" }).handler(
  async (): Promise<PublicPlace[]> => {
    const { createPublicSupabaseClient } = await import("./supabase-public.server");
    const supabase = createPublicSupabaseClient();

    const { data: places, error } = await supabase
      .from("places")
      .select(
        "id, name, google_place_id, address, city, country, lat, lng, rating, price_level, tags, note, visited_on",
      )
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    if (!places || places.length === 0) return [];

    // Photo paths are public (place_photos has a public SELECT policy); the
    // browser turns them into fresh signed URLs so links never expire.
    const { data: photos } = await supabase
      .from("place_photos")
      .select("place_id, storage_path, position")
      .order("position", { ascending: true });

    return places.map((place) => ({
      id: place.id,
      name: place.name,
      googlePlaceId: place.google_place_id,
      address: place.address,
      city: place.city,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating === null ? null : Number(place.rating),
      priceLevel: place.price_level,
      tags: place.tags ?? [],
      note: place.note,
      visitedOn: place.visited_on,
      photos: (photos ?? [])
        .filter((p) => p.place_id === place.id)
        .map((p) => signedByPath.get(p.storage_path))
        .filter((url): url is string => Boolean(url)),
    }));
  },
);

export const getLiveDetails = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ googlePlaceId: z.string().min(1) }).parse(input))
  .handler(async ({ data }) => {
    const { getPlaceDetails } = await import("./google-places.server");
    try {
      return { details: await getPlaceDetails(data.googlePlaceId), error: null };
    } catch (error) {
      console.error("Live place details failed", error);
      return {
        details: null,
        error: error instanceof Error ? error.message : "Could not load live details",
      };
    }
  });
