const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

function gatewayHeaders(fieldMask: string) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !connectionKey) {
    throw new Error("Google Maps is not connected");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": connectionKey,
    "Content-Type": "application/json",
    "X-Goog-FieldMask": fieldMask,
  };
}

async function readError(response: Response) {
  const body = await response.text().catch(() => "");
  if (response.status === 403) {
    return `Google Maps request was denied (403). ${body}`;
  }
  return `Google Maps request failed [${response.status}]: ${body}`;
}

export type PlaceSuggestion = {
  googlePlaceId: string;
  name: string;
  address: string;
  city: string | null;
  country: string | null;
  lat: number;
  lng: number;
};

type SearchTextResponse = {
  places?: Array<{
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: Array<{ longText?: string; types?: string[] }>;
  }>;
};

function pickComponent(
  components: Array<{ longText?: string; types?: string[] }> | undefined,
  type: string,
) {
  return components?.find((c) => c.types?.includes(type))?.longText ?? null;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const response = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: gatewayHeaders(
      "places.id,places.displayName,places.formattedAddress,places.location,places.addressComponents",
    ),
    body: JSON.stringify({ textQuery: query, maxResultCount: 8 }),
  });

  if (!response.ok) throw new Error(await readError(response));

  const data = (await response.json()) as SearchTextResponse;
  return (data.places ?? [])
    .filter((p) => p.id && p.location?.latitude != null && p.location?.longitude != null)
    .map((p) => ({
      googlePlaceId: p.id!,
      name: p.displayName?.text ?? "Unnamed place",
      address: p.formattedAddress ?? "",
      city:
        pickComponent(p.addressComponents, "locality") ??
        pickComponent(p.addressComponents, "postal_town") ??
        pickComponent(p.addressComponents, "administrative_area_level_1"),
      country: pickComponent(p.addressComponents, "country"),
      lat: p.location!.latitude!,
      lng: p.location!.longitude!,
    }));
}

export type LivePlaceDetails = {
  googleMapsUri: string | null;
  website: string | null;
  phone: string | null;
  address: string | null;
  googleRating: number | null;
  userRatingCount: number | null;
  openNow: boolean | null;
  weekdayHours: string[] | null;
  priceLevel: string | null;
};

type DetailsResponse = {
  formattedAddress?: string;
  googleMapsUri?: string;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  regularOpeningHours?: { openNow?: boolean; weekdayDescriptions?: string[] };
};

export async function getPlaceDetails(placeId: string): Promise<LivePlaceDetails> {
  const response = await fetch(
    `${GATEWAY_URL}/places/v1/places/${encodeURIComponent(placeId)}`,
    {
      headers: gatewayHeaders(
        "formattedAddress,googleMapsUri,websiteUri,nationalPhoneNumber,rating,userRatingCount,priceLevel,regularOpeningHours",
      ),
    },
  );

  if (!response.ok) throw new Error(await readError(response));

  const data = (await response.json()) as DetailsResponse;
  return {
    googleMapsUri: data.googleMapsUri ?? null,
    website: data.websiteUri ?? null,
    phone: data.nationalPhoneNumber ?? null,
    address: data.formattedAddress ?? null,
    googleRating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? null,
    openNow: data.regularOpeningHours?.openNow ?? null,
    weekdayHours: data.regularOpeningHours?.weekdayDescriptions ?? null,
    priceLevel: data.priceLevel ?? null,
  };
}
