import { useQuery } from "@tanstack/react-query";
import { getLiveDetails, type PublicPlace } from "@/lib/places.functions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, Globe, Phone, Star } from "lucide-react";
import { useState } from "react";

function priceLabel(level: number | null) {
  if (!level) return null;
  return "$".repeat(level);
}

export default function PlacePanel({
  place,
  onClose,
}: {
  place: PublicPlace;
  onClose: () => void;
}) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const live = useQuery({
    queryKey: ["live-details", place.googlePlaceId],
    enabled: Boolean(place.googlePlaceId),
    staleTime: 1000 * 60 * 30,
    queryFn: () => getLiveDetails({ data: { googlePlaceId: place.googlePlaceId! } }),
  });

  const details = live.data?.details ?? null;
  const photos = place.photos;

  return (
    <aside className="flex h-full flex-col overflow-y-auto border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-2xl leading-tight">{place.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {[place.city, place.country].filter(Boolean).join(", ") || place.address}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close place details">
          <X className="size-4" />
        </Button>
      </div>

      {photos.length > 0 && (
        <div className="relative aspect-[4/5] w-full shrink-0 bg-muted">
          <img
            src={photos[photoIndex]}
            alt={`${place.name} photo ${photoIndex + 1}`}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          {photos.length > 1 && (
            <>
              <div className="pointer-events-none absolute inset-x-3 top-3 flex gap-1">
                {photos.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i === photoIndex ? "bg-primary-foreground" : "bg-primary-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <button
                className="absolute inset-y-0 left-0 w-1/3"
                aria-label="Previous photo"
                onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
              />
              <button
                className="absolute inset-y-0 right-0 w-1/3"
                aria-label="Next photo"
                onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
              />
            </>
          )}
        </div>
      )}

      <div className="space-y-5 px-5 py-5">
        <div className="flex flex-wrap items-center gap-3">
          {place.rating !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
              <Star className="size-3.5 fill-current" />
              {place.rating.toFixed(1)}
            </span>
          )}
          {priceLabel(place.priceLevel) && (
            <span className="text-sm text-muted-foreground">{priceLabel(place.priceLevel)}</span>
          )}
          {place.visitedOn && (
            <span className="text-sm text-muted-foreground">
              Visited {new Date(place.visitedOn).toLocaleDateString()}
            </span>
          )}
        </div>

        {place.note && (
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
            {place.note}
          </p>
        )}

        {place.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {place.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          {live.isLoading && <p className="text-sm text-muted-foreground">Loading live info…</p>}
          {live.data?.error && (
            <p className="text-sm text-muted-foreground">{live.data.error}</p>
          )}
          {details && (
            <>
              {details.openNow !== null && details.openNow !== undefined && (
                <p className="text-sm">
                  <span className={details.openNow ? "text-accent" : "text-destructive"}>
                    {details.openNow ? "Open now" : "Closed now"}
                  </span>
                </p>
              )}
              {details.googleRating && (
                <p className="text-sm text-muted-foreground">
                  Google: {details.googleRating} ({details.userRatingCount ?? 0} reviews)
                </p>
              )}
              {details.address && (
                <p className="text-sm text-muted-foreground">{details.address}</p>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {details.googleMapsUri && (
                  <Button asChild size="sm" variant="default">
                    <a href={details.googleMapsUri} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" /> Google Maps
                    </a>
                  </Button>
                )}
                {details.website && (
                  <Button asChild size="sm" variant="outline">
                    <a href={details.website} target="_blank" rel="noreferrer">
                      <Globe className="size-4" /> Website
                    </a>
                  </Button>
                )}
                {details.phone && (
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${details.phone}`}>
                      <Phone className="size-4" /> Call
                    </a>
                  </Button>
                )}
              </div>
              {details.weekdayHours && details.weekdayHours.length > 0 && (
                <details className="pt-2 text-sm text-muted-foreground">
                  <summary className="cursor-pointer">Opening hours</summary>
                  <ul className="mt-2 space-y-1">
                    {details.weekdayHours.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
