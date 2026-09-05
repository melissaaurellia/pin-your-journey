import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getEngagement, postComment, toggleHeart } from "@/lib/engagement.functions";

const STORAGE_KEY = "ptd-visitor-id";

function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEY, id);
    }
    setVisitorId(id);
  }, []);

  return visitorId;
}

export default function PostcardGuestbook({ placeId }: { placeId: string }) {
  const visitorId = useVisitorId();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const queryKey = ["engagement", placeId, visitorId];

  const { data } = useQuery({
    queryKey,
    enabled: Boolean(visitorId),
    queryFn: () => getEngagement({ data: { placeId, visitorId: visitorId! } }),
  });

  const heart = useMutation({
    mutationFn: () => toggleHeart({ data: { placeId, visitorId: visitorId! } }),
    onSuccess: (result) => queryClient.setQueryData(queryKey, result),
  });

  const comment = useMutation({
    mutationFn: () => postComment({ data: { placeId, authorName: name, body } }),
    onSuccess: () => {
      setName("");
      setBody("");
      setError(null);
      queryClient.invalidateQueries({ queryKey });
    },
    onError: () => setError("Sorry — that comment couldn't be posted. Please try again."),
  });

  const hearts = data?.hearts ?? 0;
  const hearted = data?.hearted ?? false;
  const comments = data?.comments ?? [];
  const canPost = name.trim().length > 0 && body.trim().length > 0 && !comment.isPending;

  return (
    <div className="space-y-4 border-t border-dashed border-border pt-4">
      <div className="flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant={hearted ? "default" : "outline"}
          disabled={!visitorId || heart.isPending}
          onClick={() => heart.mutate()}
          aria-pressed={hearted}
          className="min-h-[44px]"
        >
          <Heart className={`size-4 ${hearted ? "fill-current" : ""}`} />
          {hearted ? "Hearted" : "Heart this place"}
        </Button>
        <span className="typed text-[11px] uppercase text-muted-foreground">
          {hearts} {hearts === 1 ? "heart" : "hearts"}
        </span>
      </div>

      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (canPost) comment.mutate();
        }}
      >
        <p className="typed text-[11px] uppercase text-muted-foreground">Leave a note</p>
        <Input
          value={name}
          maxLength={40}
          onChange={(event) => setName(event.target.value)}
          placeholder="Your name"
          className="rounded-xl"
        />
        <Textarea
          value={body}
          maxLength={500}
          rows={3}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Been here? Tell me what I missed."
          className="rounded-xl"
        />
        {error && <p className="text-[11px] text-destructive">{error}</p>}
        <Button type="submit" size="sm" disabled={!canPost} className="min-h-[44px]">
          {comment.isPending ? "Sending…" : "Send it"}
        </Button>
      </form>

      {comments.length > 0 && (
        <ul className="space-y-3 pt-1">
          {comments.map((item) => (
            <li key={item.id} className="border-l-2 border-primary/30 pl-3">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="typed text-[11px] uppercase text-foreground">
                  {item.authorName}
                </span>
                <span className="typed text-[10px] uppercase text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="handwritten whitespace-pre-wrap text-foreground/90">{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
