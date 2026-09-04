import { useRef, useState } from "react";
import { Mic, Loader2, Dices } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { startRecording, blobToBase64, type Recorder } from "@/lib/wav-recorder";
import { transcribeAudio, matchPlaces } from "@/lib/recommend.functions";
import type { PublicPlace } from "@/lib/places.functions";

type Pick = { id: string; reason: string };

export default function VoiceRecommender({
  places,
  onPick,
}: {
  places: PublicPlace[];
  onPick: (id: string) => void;
}) {
  const recorderRef = useRef<Recorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
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

  async function beginRecording() {
    if (busy || recording) return;
    try {
      recorderRef.current = await startRecording();
      setRecording(true);
    } catch (error) {
      console.error(error);
      toast.error("Microphone access is needed to speak your request.");
    }
  }

  async function endRecording() {
    if (!recorderRef.current) return;
    const recorder = recorderRef.current;
    recorderRef.current = null;
    setRecording(false);
    setBusy(true);
    try {
      const blob = await recorder.stop();
      if (blob.size < 4096) {
        toast("That was too quick — hold the button while you speak.");
        return;
      }
      const result = await transcribeAudio({
        data: { audioBase64: await blobToBase64(blob), mimeType: "audio/wav" },
      });
      if (!result.text) {
        toast(result.error ?? "I didn't catch that.");
        return;
      }
      setTranscript(result.text);
      setBusy(false);
      await runMatch(result.text);
    } catch (error) {
      console.error(error);
      toast.error("Recording failed. Try typing instead.");
    } finally {
      setBusy(false);
    }
  }

  function surpriseMe() {
    if (places.length === 0) return;
    const random = places[Math.floor(Math.random() * places.length)];
    if (!random) return;
    setTranscript("Surprise me");
    setPicks([{ id: random.id, reason: "A random pin from the collection." }]);
    onPick(random.id);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-xl">What are you in the mood for?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hold the button and say it out loud — or type it.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onPointerDown={beginRecording}
          onPointerUp={endRecording}
          onPointerLeave={() => recording && endRecording()}
          onContextMenu={(event) => event.preventDefault()}
          className={`inline-flex size-16 shrink-0 touch-none select-none items-center justify-center rounded-full border-2 border-foreground/15 transition-transform ${
            recording
              ? "scale-110 bg-destructive text-destructive-foreground"
              : "bg-primary text-primary-foreground hover:scale-105"
          } disabled:opacity-60`}
          aria-label="Hold to record your request"
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <Mic className="size-6" />}
        </button>
        <div className="text-sm text-muted-foreground">
          {recording ? "Listening… release when you're done" : transcript || "Hold to speak"}
        </div>
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!typed.trim()) return;
          setTranscript(typed.trim());
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

      <Button variant="secondary" className="w-full" onClick={surpriseMe} disabled={busy}>
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
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-secondary"
                >
                  <span className="block font-medium">{place.name}</span>
                  <span className="block text-sm text-muted-foreground">{pick.reason}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
