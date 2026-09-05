import { useState } from "react";
import { Dices } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { matchPlaces } from "@/lib/recommend.functions";
import type { PublicPlace } from "@/lib/places.functions";

type Pick = { id: string; reason: string };

export default function VoiceRecommender({
  places,
  onPick,
}: {
  places: PublicPlace[];
  onPick: (id: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [picks, setPicks] = useState<Pick[]>([]);

  const byId = new Map(places.map((p) => [p.id, p]));

  async function runMatch(request: string) {
    setBusy(true);
    setPicks([]);
    try {
      const result = await matchPlaces({
        data: {
          request,
          candidates: places.slice(0, 300).map((p) => ({
            id: p.id,
            name: p.name,
            city: p.city,
            country: p.country,
            tags: p.tags,
            rating: p.rating,
            note: p.note ? p.note.slice(0, 300) : null,
          })),
        },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.picks.length === 0) {
        toast("No match yet — try describing it differently.");
        return;
      }
      setPicks(result.picks);
      const first = result.picks[0];
      if (first) onPick(first.id);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong finding a spot.");
    } finally {
      setBusy(false);
    }
  }

  function surpriseMe() {
    if (places.length === 0) return;
    const random = places[Math.floor(Math.random() * places.length)];
    if (!random) return;
    setPicks([{ id: random.id, reason: "A random pin from the collection." }]);
    onPick(random.id);
  }

  return (
    <div className="postcard airmail-edge space-y-4 p-5">
      <div>
        <p className="typed text-[10px] uppercase text-muted-foreground">Dispatch desk</p>
        <h2 className="font-display text-2xl leading-tight">What do you want to explore next?</h2>
        <p className="handwritten mt-1 text-muted-foreground">
          Input your dream destination
        </p>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!typed.trim()) return;
          runMatch(typed.trim());
        }}
      >
        <Input
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
          placeholder="e.g. cosy dinner in Lisbon"
          disabled={busy}
        />
        <Button type="submit" variant="outline" disabled={busy || !typed.trim()}>
          Find
        </Button>
      </form>

      <Button
        variant="secondary"
        className="typed w-full rounded-none text-xs uppercase"
        onClick={surpriseMe}
        disabled={busy}
      >
        <Dices className="size-4" /> Surprise me
      </Button>

      {picks.length > 0 && (
        <ul className="space-y-2 border-t border-border pt-4">
          {picks.map((pick) => {
            const place = byId.get(pick.id);
            if (!place) return null;
            return (
              <li key={pick.id}>
                <button
                  onClick={() => onPick(pick.id)}
                  className="postcard w-full px-3 py-2 text-left transition-transform hover:-translate-y-0.5"
                >
                  <span className="block font-display text-lg leading-tight">{place.name}</span>
                  <span className="handwritten block text-muted-foreground">{pick.reason}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
