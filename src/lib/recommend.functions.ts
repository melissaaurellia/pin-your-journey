import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const AI_BASE = "https://ai.gateway.lovable.dev/v1";

function aiKey() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("AI is not configured");
  return key;
}

export const transcribeAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        audioBase64: z.string().min(100),
        mimeType: z.string().default("audio/wav"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
    if (bytes.byteLength < 2048) {
      return { text: null, error: "That recording was too short — hold the button and speak." };
    }

    const form = new FormData();
    form.append("model", "openai/gpt-4o-mini-transcribe");
    form.append("file", new Blob([bytes], { type: data.mimeType }), "recording.wav");

    const response = await fetch(`${AI_BASE}/audio/transcriptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey()}` },
      body: form,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Transcription failed", response.status, body);
      return {
        text: null,
        error:
          response.status === 402
            ? "AI credits ran out — top up to keep using voice search."
            : "Couldn't understand that recording. Try again or type instead.",
      };
    }

    const json = (await response.json()) as { text?: string };
    const text = (json.text ?? "").trim();
    return { text: text.length > 0 ? text : null, error: text ? null : "I didn't catch that." };
  });

const candidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  country: z.string().nullable(),
  tags: z.array(z.string()),
  rating: z.number().nullable(),
  note: z.string().nullable(),
});

export const matchPlaces = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        request: z.string().min(1).max(500),
        candidates: z.array(candidateSchema).max(300),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (data.candidates.length === 0) {
      return { picks: [], error: null };
    }

    const response = await fetch(`${AI_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${aiKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3.7-flash",
        messages: [
          {
            role: "system",
            content:
              "You match a spoken request to places from a personal travel journal. Only ever choose from the provided list. Return the 3 best matches, best first. If nothing fits well, return the closest options anyway. Reply with JSON only: {\"picks\":[{\"id\":\"...\",\"reason\":\"one short friendly sentence\"}]}",
          },
          {
            role: "user",
            content: `Request: ${data.request}\n\nPlaces:\n${JSON.stringify(data.candidates)}`,
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error("Match failed", response.status, body);
      return {
        picks: [],
        error:
          response.status === 402
            ? "AI credits ran out — top up to keep using the recommender."
            : "The recommender is unavailable right now.",
      };
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content ?? "{}";

    try {
      const parsed = z
        .object({ picks: z.array(z.object({ id: z.string(), reason: z.string() })) })
        .parse(JSON.parse(content));
      const valid = parsed.picks.filter((p) => data.candidates.some((c) => c.id === p.id));
      return { picks: valid, error: null };
    } catch (error) {
      console.error("Could not parse match response", error, content);
      return { picks: [], error: "The recommender gave an unexpected answer. Try again." };
    }
  });
