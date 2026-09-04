import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  deletePlace,
  listMyPlaces,
  savePlace,
  searchPlaceSuggestions,
} from "@/lib/manage-places.functions";
import type { PlaceSuggestion } from "@/lib/google-places.server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/manage")({
  head: () => ({
    meta: [
      { title: "My pins — Pin There Done That" },
      { name: "description", content: "Add, edit and remove the places on your map." },
      { property: "og:title", content: "My pins — Pin There Done That" },
      { property: "og:description", content: "Add, edit and remove the places on your map." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ManagePage,
});

type PhotoDraft = { path: string; url: string };

type Draft = {
  id?: string;
  name: string;
  googlePlaceId: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  rating: string;
  priceLevel: string;
  tags: string;
  note: string;
  visitedOn: string;
  photos: PhotoDraft[];
};

const emptyDraft: Draft = {
  name: "",
  googlePlaceId: null,
  address: null,
  city: null,
  country: null,
  lat: null,
  lng: null,
  rating: "",
  priceLevel: "",
  tags: "",
  note: "",
  visitedOn: "",
  photos: [],
};

function ManagePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const myPlaces = useQuery({ queryKey: ["my-places"], queryFn: () => listMyPlaces() });

  const remove = useMutation({
    mutationFn: (id: string) => deletePlace({ data: { id } }),
    onSuccess: () => {
      toast.success("Pin removed");
      queryClient.invalidateQueries({ queryKey: ["my-places"] });
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
    onError: () => toast.error("Couldn't remove that pin"),
  });

  async function editExisting(place: any) {
    const photos: PhotoDraft[] = [];
    for (const photo of [...(place.place_photos ?? [])].sort(
      (a: any, b: any) => a.position - b.position,
    )) {
      const { data } = await supabase.storage
        .from("place-photos")
        .createSignedUrl(photo.storage_path, 3600);
      photos.push({ path: photo.storage_path, url: data?.signedUrl ?? "" });
    }
    setDraft({
      id: place.id,
      name: place.name,
      googlePlaceId: place.google_place_id,
      address: place.address,
      city: place.city,
      country: place.country,
      lat: place.lat,
      lng: place.lng,
      rating: place.rating === null ? "" : String(place.rating),
      priceLevel: place.price_level === null ? "" : String(place.price_level),
      tags: (place.tags ?? []).join(", "),
      note: place.note ?? "",
      visitedOn: place.visited_on ?? "",
      photos,
    });
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-dvh bg-background paper-grain">
      <header className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-6">
        <h1 className="text-xl md:text-2xl">My pins</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/">View map</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-6 p-4 md:grid-cols-[1fr_1.2fr] md:p-6">
        <section className="space-y-3">
          <Button className="w-full" onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="size-4" /> Add a place
          </Button>

          {myPlaces.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {myPlaces.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">No pins yet — add your first one.</p>
          )}

          <ul className="space-y-2">
            {(myPlaces.data ?? []).map((place: any) => (
              <li
                key={place.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <button className="min-w-0 flex-1 text-left" onClick={() => editExisting(place)}>
                  <span className="block truncate font-medium">{place.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">
                    {[place.city, place.country].filter(Boolean).join(", ")}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${place.name}`}
                  onClick={() => remove.mutate(place.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section>
          {draft ? (
            <PlaceForm
              key={draft.id ?? "new"}
              draft={draft}
              setDraft={setDraft}
              userId={userId}
              onSaved={() => {
                setDraft(null);
                queryClient.invalidateQueries({ queryKey: ["my-places"] });
                queryClient.invalidateQueries({ queryKey: ["places"] });
              }}
            />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Pick a pin to edit, or add a new place.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function PlaceForm({
  draft,
  setDraft,
  userId,
  onSaved,
}: {
  draft: Draft;
  setDraft: (draft: Draft | null) => void;
  userId: string | null;
  onSaved: () => void;
}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);

  const canSave = useMemo(
    () => draft.name.trim().length > 0 && draft.lat !== null && draft.lng !== null,
    [draft],
  );

  const save = useMutation({
    mutationFn: () =>
      savePlace({
        data: {
          id: draft.id,
          name: draft.name.trim(),
          googlePlaceId: draft.googlePlaceId,
          address: draft.address,
          city: draft.city,
          country: draft.country,
          lat: draft.lat!,
          lng: draft.lng!,
          rating: draft.rating === "" ? null : Number(draft.rating),
          priceLevel: draft.priceLevel === "" ? null : Number(draft.priceLevel),
          tags: draft.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean),
          note: draft.note.trim() || null,
          visitedOn: draft.visitedOn || null,
          photoPaths: draft.photos.map((photo) => photo.path),
        },
      }),
    onSuccess: () => {
      toast.success("Pin saved");
      onSaved();
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Couldn't save"),
  });

  async function runSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const result = await searchPlaceSuggestions({ data: { query: query.trim() } });
      if (result.error) toast.error(result.error);
      setSuggestions(result.suggestions);
    } finally {
      setSearching(false);
    }
  }

  async function uploadPhotos(files: FileList) {
    if (!userId) return;
    setUploading(true);
    try {
      const added: PhotoDraft[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${userId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("place-photos").upload(path, file);
        if (error) {
          toast.error(`Couldn't upload ${file.name}`);
          continue;
        }
        const { data } = await supabase.storage.from("place-photos").createSignedUrl(path, 3600);
        added.push({ path, url: data?.signedUrl ?? "" });
      }
      setDraft({ ...draft, photos: [...draft.photos, ...added] });
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      className="space-y-4 rounded-xl border border-border bg-card p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSave) save.mutate();
      }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl">{draft.id ? "Edit pin" : "New pin"}</h2>
        <Button type="button" variant="ghost" size="icon" onClick={() => setDraft(null)}>
          <X className="size-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="search">Find the place</Label>
        <div className="flex gap-2">
          <Input
            id="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                runSearch();
              }
            }}
            placeholder="Restaurant, bar, museum…"
          />
          <Button type="button" variant="outline" onClick={runSearch} disabled={searching}>
            {searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}
          </Button>
        </div>
        {suggestions.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {suggestions.map((suggestion) => (
              <li key={suggestion.googlePlaceId}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-secondary"
                  onClick={() => {
                    setDraft({
                      ...draft,
                      name: draft.name || suggestion.name,
                      googlePlaceId: suggestion.googlePlaceId,
                      address: suggestion.address,
                      city: suggestion.city,
                      country: suggestion.country,
                      lat: suggestion.lat,
                      lng: suggestion.lng,
                    });
                    setSuggestions([]);
                  }}
                >
                  <span className="block text-sm font-medium">{suggestion.name}</span>
                  <span className="block text-xs text-muted-foreground">{suggestion.address}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={draft.name}
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
          required
        />
        {draft.address && <p className="text-xs text-muted-foreground">{draft.address}</p>}
        {draft.lat === null && (
          <p className="text-xs text-destructive">Search and pick a place to set its location.</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="rating">Rating /10</Label>
          <Input
            id="rating"
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={draft.rating}
            onChange={(event) => setDraft({ ...draft, rating: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price">Price 1-4</Label>
          <Input
            id="price"
            type="number"
            min="1"
            max="4"
            value={draft.priceLevel}
            onChange={(event) => setDraft({ ...draft, priceLevel: event.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="visited">Visited</Label>
          <Input
            id="visited"
            type="date"
            value={draft.visitedOn}
            onChange={(event) => setDraft({ ...draft, visitedOn: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input
          id="tags"
          value={draft.tags}
          onChange={(event) => setDraft({ ...draft, tags: event.target.value })}
          placeholder="dinner, wine, date night"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="note">Note</Label>
        <Textarea
          id="note"
          rows={5}
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
          placeholder="What to order, when to go, who to bring…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="photos">Photos</Label>
        <Input
          id="photos"
          type="file"
          accept="image/*"
          multiple
          disabled={uploading}
          onChange={(event) => event.target.files && uploadPhotos(event.target.files)}
        />
        {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
        {draft.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {draft.photos.map((photo) => (
              <div key={photo.path} className="relative">
                <img
                  src={photo.url}
                  alt=""
                  className="size-20 rounded-md object-cover"
                  loading="lazy"
                />
                <button
                  type="button"
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-1 text-destructive-foreground"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      photos: draft.photos.filter((item) => item.path !== photo.path),
                    })
                  }
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={!canSave || save.isPending}>
        {save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save pin"}
      </Button>
    </form>
  );
}
