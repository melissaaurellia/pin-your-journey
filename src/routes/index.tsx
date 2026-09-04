import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPlaces, type PublicPlace } from "@/lib/places.functions";
import { DEMO_PLACES } from "@/lib/demo-places";
import MapView from "@/components/MapView";
import PlacePanel from "@/components/PlacePanel";
import VoiceRecommender from "@/components/VoiceRecommender";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { CompassRose, Paperclip } from "@/components/decor";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pin There Done That — my map of places worth going" },
      {
        name: "description",
        content:
          "Every place I've been, pinned with notes, photos and ratings. Explore the map or let it pick somewhere for you.",
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

function Home() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focus, setFocus] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: savedPlaces = [], isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: () => listPlaces(),
  });

  // Until the first real pin is saved, show placeholder pins so the map isn't empty.
  const isDemo = !isLoading && savedPlaces.length === 0;
  const places = isDemo ? DEMO_PLACES : savedPlaces;

  const tags = useMemo(() => {
    const counts = new Map<string, number>();
    places.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) ?? 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([tag]) => tag);
  }, [places]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return places.filter((place) => {
      if (activeTag && !place.tags.includes(activeTag)) return false;
      if (!term) return true;
      return [place.name, place.city, place.country, place.note]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(term));
    });
  }, [places, activeTag, search]);

  const selected = places.find((p) => p.id === selectedId) ?? null;

  function select(id: string) {
    const place = places.find((p) => p.id === id);
    setSelectedId(id);
    if (place) setFocus({ lat: place.lat, lng: place.lng, zoom: 13 });
    setSheetOpen(true);
  }

  return (
    <div className="flex h-dvh flex-col parchment">
      <header className="flex items-center justify-between gap-4 border-b-2 border-double border-border px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          <CompassRose className="size-8 shrink-0 text-primary md:size-10" />
          <div>
            <h1 className="text-xl leading-none tracking-tight md:text-3xl">
              Pin There Done That
            </h1>
            <p className="typed mt-1 text-[10px] uppercase text-muted-foreground md:text-[11px]">
              A field map of places worth going
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="postmark hidden px-3 py-1 text-[11px] sm:inline">
            {places.length} pins
          </span>
          <Button asChild variant="ghost" size="sm" className="typed text-xs uppercase">
            <Link to="/manage">My pins</Link>
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        <div className="flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-border p-4 md:w-[400px] md:border-r-2 md:border-double">
          <VoiceRecommender places={places} onPick={select} />

          <div className="space-y-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search pins"
                className="pl-9"
              />
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  onClick={() => setActiveTag(null)}
                  variant={activeTag === null ? "default" : "outline"}
                  className="typed cursor-pointer rounded-none text-[11px] font-normal uppercase"
                >
                  All
                </Badge>
                {tags.map((tag) => (
                  <Badge
                    key={tag}
                    onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                    variant={activeTag === tag ? "default" : "outline"}
                    className="typed cursor-pointer rounded-none text-[11px] font-normal uppercase"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {isDemo && (
            <p className="handwritten border-l-2 border-primary/40 px-3 py-1 text-muted-foreground">
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
          />
        </div>

        <div className="relative min-h-[45dvh] flex-1">
          <MapView places={filtered} selectedId={selectedId} onSelect={select} focus={focus} />

          {selected && sheetOpen && (
            <div className="absolute inset-y-0 right-0 z-10 w-full max-w-[420px] border-l border-border shadow-xl">
              <PlacePanel place={selected} onClose={() => setSheetOpen(false)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlaceList({
  places,
  isLoading,
  selectedId,
  onSelect,
}: {
  places: PublicPlace[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
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
    <ul className="space-y-5 pb-6 pt-2">
      {places.map((place, index) => (
        <li key={place.id} style={{ transform: `rotate(${index % 2 ? 0.5 : -0.6}deg)` }}>
          <button
            onClick={() => onSelect(place.id)}
            className={`postcard group relative flex w-full gap-3 p-3 pl-4 text-left transition-transform hover:-translate-y-0.5 ${
              selectedId === place.id ? "ring-2 ring-primary/60" : ""
            }`}
          >
            {/* paper clip holding the photo to the card */}
            <Paperclip className="absolute -top-3 left-6 z-10 h-10 w-5 text-foreground/45 drop-shadow-sm" />

            {place.photos[0] ? (
              <img
                src={place.photos[0]}
                alt=""
                loading="lazy"
                className="photo-print h-20 w-16 shrink-0 -rotate-1 object-cover"
              />
            ) : (
              <div className="photo-print flex h-20 w-16 shrink-0 -rotate-1 items-center justify-center text-[10px] text-muted-foreground">
                no photo
              </div>
            )}

            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate font-display text-lg leading-tight">{place.name}</span>
                {place.rating !== null && (
                  <span className="typed shrink-0 text-xs text-primary">
                    {place.rating.toFixed(1)}
                  </span>
                )}
              </div>
              <span className="typed block text-[11px] uppercase text-muted-foreground">
                {[place.city, place.country].filter(Boolean).join(" · ")}
              </span>
              {place.note && (
                <p className="handwritten mt-1 line-clamp-2 text-foreground/80">{place.note}</p>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
