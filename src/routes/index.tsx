import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listPlaces, type PublicPlace } from "@/lib/places.functions";
import { DEMO_PLACES } from "@/lib/demo-places";
import MapView from "@/components/MapView";
import PlacePanel from "@/components/PlacePanel";
import VoiceRecommender from "@/components/VoiceRecommender";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Search } from "lucide-react";
import { getEngagementCounts, type EngagementCounts } from "@/lib/engagement.functions";
import { PhotoAttachment, attachmentFor } from "@/components/decor";
import ptdLogoAsset from "@/assets/ptd-logo.png.asset.json";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pin There Done That" },
      {
        name: "description",
        content:
          "A field map of Melissa's travel — every place pinned with notes, photos and ratings. Explore the map or let it pick somewhere for you.",
      },
      { property: "og:title", content: "Pin There Done That" },
      {
        property: "og:description",
        content: "A personal world map of tried-and-tested places, with notes, photos and ratings.",
      },
    ],
  }),
  component: Home,
});

const ANY = "__any__";

function Home() {
  const isMobile = useIsMobile();
  const [mobileView, setMobileView] = useState<"map" | "list">("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [activeTag, setActiveTag] = useState<string>(ANY);
  const [activeLocation, setActiveLocation] = useState<string>(ANY);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  // Lock background scrolling while the mobile detail sheet is open.
  useEffect(() => {
    if (!isMobile || !sheetOpen) return;
    const y = window.scrollY;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
      window.scrollTo(0, y);
    };
  }, [isMobile, sheetOpen]);


  const { data: rawPlaces = [], isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: () => listPlaces(),
  });

  // listPlaces returns storage paths; sign them fresh in the browser on every
  // visit so photo links can never expire on a cached page.
  const { data: savedPlaces = [] } = useQuery({
    queryKey: ["place-photo-urls", rawPlaces],
    enabled: rawPlaces.length > 0,
    queryFn: async () => {
      const paths = rawPlaces.flatMap((p) => p.photos);
      if (paths.length === 0) return rawPlaces;
      const { data: signed } = await supabase.storage
        .from("place-photos")
        .createSignedUrls(paths, 60 * 60 * 24);
      const byPath = new Map(
        (signed ?? [])
          .filter((item) => item.path && item.signedUrl)
          .map((item) => [item.path!, item.signedUrl!] as const),
      );
      return rawPlaces.map((place) => ({
        ...place,
        photos: place.photos
          .map((path) => byPath.get(path))
          .filter((url): url is string => Boolean(url)),
      }));
    },
  });

  // Until the first real pin is saved, show placeholder pins so the map isn't empty.
  const isDemo = !isLoading && rawPlaces.length === 0;
  const places = isDemo ? DEMO_PLACES : savedPlaces;

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    places.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [places]);

  const countries = useMemo(() => {
    const set = new Set<string>();
    places.forEach((p) => {
      if (p.country) set.add(p.country);
    });
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [places]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return places.filter((place) => {
      if (activeTag !== ANY && !place.tags.includes(activeTag)) return false;
      if (activeLocation !== ANY && place.country !== activeLocation) return false;
      if (!term) return true;
      return [place.name, place.city, place.country, place.note]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [places, activeTag, activeLocation, search]);

  const selected = places.find((p) => p.id === selectedId) ?? null;

  // Heart/comment counts only exist for real (UUID) pins, not demo placeholders.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const realIds = useMemo(
    () => places.map((p) => p.id).filter((id) => UUID_RE.test(id)),
    [places],
  );
  const { data: counts = {} } = useQuery({
    queryKey: ["engagement-counts", realIds],
    enabled: realIds.length > 0,
    queryFn: () => getEngagementCounts({ data: { placeIds: realIds } }),
  });

  function select(id: string) {
    const place = places.find((p) => p.id === id);
    setSelectedId(id);
    if (place) setFocus({ lat: place.lat, lng: place.lng, zoom: 13 });
    setSheetOpen(true);
  }

  return (
    <div className="parchment flex min-h-dvh flex-col overflow-x-hidden md:h-dvh md:min-h-0">
      {/* Combined sticky header + mobile switch */}
      <div className="sticky top-0 z-30 bg-[hsl(var(--background))]/95 shadow-sm backdrop-blur md:static md:bg-transparent md:shadow-none md:backdrop-blur-none">
        <header className="flex items-center justify-between gap-3 border-b-2 border-double border-border px-3 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] md:px-6 md:py-3 md:pt-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-3">
            <img
              src={ptdLogoAsset.url}
              alt="Pin There Done That logo"
              className="size-11 shrink-0 drop-shadow-sm md:size-12"
            />
            <div className="min-w-0">
              <h1 className="truncate text-[22px] leading-none tracking-tight md:text-3xl">
                Pin There Done That
              </h1>
              <p className="typed mt-1 hidden truncate text-[9px] uppercase tracking-normal text-muted-foreground min-[360px]:block md:text-[11px]">
                A field map of Melissa's travel
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="postmark hidden px-3 py-1 text-[11px] sm:inline">
              {places.length} pins
            </span>
            <Link
              to="/about"
              className="typed inline-flex min-h-[44px] items-center rounded-md border border-dashed border-border bg-[hsl(var(--background))]/70 px-3 text-[11px] uppercase tracking-wide text-foreground shadow-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]"
            >
              About
            </Link>
          </div>
        </header>

        {/* Mobile Map / List switch */}
        <div className="px-3 py-2 md:hidden">
          <div className="postcard grid h-[48px] grid-cols-2 gap-1 rounded-xl p-1">
            {(["map", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMobileView(mode)}
                aria-pressed={mobileView === mode}
                className={`typed flex items-center justify-center rounded-lg text-[11px] uppercase tracking-wide transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                  mobileView === mode
                    ? "bg-primary/25 text-foreground shadow-inner ring-1 ring-primary/60"
                    : "text-muted-foreground hover:bg-foreground/5"
                }`}
              >
                {mode === "map" ? "Map" : "List"}
              </button>
            ))}
          </div>
        </div>
      </div>


      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <div
          className={`w-full shrink-0 flex-col gap-5 border-border px-3 pb-4 pt-2 md:flex md:w-[400px] md:overflow-y-auto md:border-r-2 md:border-double md:p-4 ${
            mobileView === "list" ? "flex" : "hidden"
          }`}
        >
          <VoiceRecommender places={places} onPick={select} />

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pins"
                className="rounded-xl pl-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Select value={activeLocation} onValueChange={setActiveLocation}>
                <SelectTrigger className="typed rounded-xl text-[11px] uppercase">
                  <SelectValue placeholder="Country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY} className="typed text-[11px] uppercase">
                    All countries
                  </SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country} className="typed text-[11px] uppercase">
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={activeTag} onValueChange={setActiveTag}>
                <SelectTrigger className="typed rounded-xl text-[11px] uppercase">
                  <SelectValue placeholder="Vibe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ANY} className="typed text-[11px] uppercase">
                    All vibes
                  </SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag} className="typed text-[11px] uppercase">
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isDemo && (
            <p className="handwritten border-l-2 border-primary/40 px-3 py-1">
              These are example pins. Add your own from{" "}
              <Link to="/manage" className="underline">
                My pins
              </Link>{" "}
              and they'll replace them.
            </p>
          )}

          <PlaceList
            places={filtered}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={select}
            counts={counts}
          />

          <div className="pb-4 pt-2 text-center">
            <Link
              to="/manage"
              className="typed inline-flex min-h-[44px] items-center px-2 text-[10px] uppercase tracking-wide text-muted-foreground/70 underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
            >
              manage
            </Link>
          </div>
        </div>

        <div
          className={`relative min-h-0 flex-1 ${
            mobileView === "map"
              ? "block h-[calc(100dvh-136px-env(safe-area-inset-top)-env(safe-area-inset-bottom))]"
              : "hidden"
          } md:block md:h-auto`}
        >
          <MapView places={filtered} selectedId={selectedId} onSelect={select} focus={focus} />

          {selected && sheetOpen && !isMobile && (
            <div className="absolute inset-y-0 right-0 z-10 w-full max-w-[420px] p-2 md:p-3">
              <PlacePanel place={selected} onClose={() => setSheetOpen(false)} />
            </div>
          )}
        </div>
      </div>

      {selected && sheetOpen && isMobile && (
        <div className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm md:hidden">
          <div className="absolute inset-x-0 bottom-0 top-6 p-2">
            <PlacePanel place={selected} onClose={() => setSheetOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}


function PlaceList({
  places,
  isLoading,
  selectedId,
  onSelect,
  counts,
}: {
  places: PublicPlace[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  counts: EngagementCounts;
}) {
  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading pins…</p>;
  }

  if (places.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No pins here yet. Add your first one from{" "}
        <Link to="/manage" className="underline">
          My pins
        </Link>
        .
      </p>
    );
  }

  return (
    <ul className="space-y-6 pb-8 pt-3">
      {places.map((place, index) => (
        <li key={place.id} style={{ transform: `rotate(${index % 2 ? 0.4 : -0.5}deg)` }}>
          <button
            onClick={() => onSelect(place.id)}
            className={`postcard group relative flex w-full items-stretch gap-4 rounded-2xl p-4 pr-3 text-left transition-transform duration-200 hover:-translate-y-1 ${
              selectedId === place.id ? "ring-2 ring-primary/60" : ""
            }`}
          >
            <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl leading-tight">{place.name}</h3>
                <p className="typed mt-1 truncate text-[10px] uppercase text-muted-foreground">
                  {[place.city, place.country].filter(Boolean).join(" · ")}
                </p>
                {place.note && (
                  <p className="handwritten mt-2 line-clamp-2">{place.note}</p>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 border-t border-dashed border-border pt-2">
                <span className="typed text-[10px] uppercase text-muted-foreground">
                  {place.visitedOn
                    ? new Date(place.visitedOn).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Date unknown"}
                </span>
              </div>
            </div>

            <div className="relative mt-2 shrink-0 rotate-2 transition-transform duration-200 group-hover:rotate-0">
              {place.photos[0] ? (
                <div className="relative">
                  <div className="stamp-frame w-[136px]">
                    <img src={place.photos[0]} alt="" loading="lazy" className="film-photo" />
                  </div>
                  <PhotoAttachment variant={attachmentFor(place.id)} />
                </div>
              ) : (
                <div className="photo-print flex h-[104px] w-[92px] items-center justify-center text-[10px] text-muted-foreground">
                  no photo
                </div>
              )}
              {counts[place.id] && (
                <div className="mt-2 flex items-center justify-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart className="size-3.5 fill-current text-primary" />
                    <span className="typed text-[10px]">{counts[place.id]!.hearts}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="size-3.5" />
                    <span className="typed text-[10px]">{counts[place.id]!.comments}</span>
                  </span>
                </div>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
