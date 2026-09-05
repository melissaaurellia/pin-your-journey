import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PlaceComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type Engagement = {
  hearts: number;
  hearted: boolean;
  comments: PlaceComment[];
};

const idSchema = z.object({
  placeId: z.string().uuid(),
  visitorId: z.string().min(8).max(64),
});

const commentSchema = z.object({
  placeId: z.string().uuid(),
  authorName: z.string().trim().min(1).max(40),
  body: z.string().trim().min(1).max(500),
});

function clean(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

async function loadEngagement(placeId: string, visitorId: string): Promise<Engagement> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const [{ count }, mine, { data: comments }] = await Promise.all([
    supabaseAdmin
      .from("place_reactions")
      .select("id", { count: "exact", head: true })
      .eq("place_id", placeId),
    supabaseAdmin
      .from("place_reactions")
      .select("id")
      .eq("place_id", placeId)
      .eq("visitor_id", visitorId)
      .maybeSingle(),
    supabaseAdmin
      .from("place_comments")
      .select("id, author_name, body, created_at")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return {
    hearts: count ?? 0,
    hearted: Boolean(mine.data),
    comments: (comments ?? []).map((c) => ({
      id: c.id,
      authorName: c.author_name,
      body: c.body,
      createdAt: c.created_at,
    })),
  };
}

export const getEngagement = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => loadEngagement(data.placeId, data.visitorId));

const countsSchema = z.object({
  placeIds: z.array(z.string().uuid()).max(200),
});

export type EngagementCounts = Record<string, { hearts: number; comments: number }>;

export const getEngagementCounts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => countsSchema.parse(input))
  .handler(async ({ data }): Promise<EngagementCounts> => {
    if (data.placeIds.length === 0) return {};
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [{ data: reactions }, { data: comments }] = await Promise.all([
      supabaseAdmin.from("place_reactions").select("place_id").in("place_id", data.placeIds),
      supabaseAdmin.from("place_comments").select("place_id").in("place_id", data.placeIds),
    ]);

    const counts: EngagementCounts = {};
    for (const id of data.placeIds) counts[id] = { hearts: 0, comments: 0 };
    for (const row of reactions ?? []) counts[row.place_id]!.hearts += 1;
    for (const row of comments ?? []) counts[row.place_id]!.comments += 1;
    return counts;
  });

export const toggleHeart = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: existing } = await supabaseAdmin
      .from("place_reactions")
      .select("id")
      .eq("place_id", data.placeId)
      .eq("visitor_id", data.visitorId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("place_reactions").delete().eq("id", existing.id);
    } else {
      await supabaseAdmin
        .from("place_reactions")
        .insert({ place_id: data.placeId, visitor_id: data.visitorId });
    }

    return loadEngagement(data.placeId, data.visitorId);
  });

export const postComment = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => commentSchema.parse(input))
  .handler(async ({ data }) => {
    const authorName = clean(data.authorName).slice(0, 40);
    const body = clean(data.body).slice(0, 500);
    if (!authorName || !body) throw new Error("Please add both a name and a comment.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("place_comments")
      .insert({ place_id: data.placeId, author_name: authorName, body });

    if (error) throw new Error(error.message);
    return { ok: true };
  });
