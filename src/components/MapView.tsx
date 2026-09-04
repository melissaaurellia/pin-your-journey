/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import type { PublicPlace } from "@/lib/places.functions";

const MAP_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#efe9dc" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6154" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6f1e6" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#d9cfbc" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#e3dccc" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#e8e2d1" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d6cd" }] },
];

function pinIcon(maps: any, active: boolean) {
  return {
    path: "M12 0C6.9 0 2.8 4.1 2.8 9.2 2.8 16.3 12 26 12 26s9.2-9.7 9.2-16.8C21.2 4.1 17.1 0 12 0z",
    fillColor: active ? "#8a3f1d" : "#b4562a",
    fillOpacity: 1,
    strokeColor: "#3a2f26",
    strokeWeight: 1.5,
    scale: active ? 1.5 : 1.15,
    anchor: new maps.Point(12, 26),
  };
}

type Props = {
  places: PublicPlace[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  focus: { lat: number; lng: number; zoom?: number } | null;
};

export default function MapView({ places, selectedId, onSelect, focus }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        mapsRef.current = maps;
        mapRef.current = new maps.Map(containerRef.current, {
          center: { lat: 20, lng: 0 },
          zoom: 2,
          styles: MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
        });
        setReady(true);
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setError("The map couldn't load right now.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Sync markers with places
  useEffect(() => {
    const maps = mapsRef.current;
    const map = mapRef.current;
    if (!ready || !maps || !map) return;

    for (const [id, marker] of markersRef.current) {
      if (!places.some((p) => p.id === id)) {
        marker.setMap(null);
        markersRef.current.delete(id);
      }
    }

    for (const place of places) {
      let marker = markersRef.current.get(place.id);
      if (!marker) {
        marker = new maps.Marker({
          position: { lat: place.lat, lng: place.lng },
          map,
          title: place.name,
          icon: pinIcon(maps, false),
        });
        marker.addListener("click", () => selectRef.current(place.id));
        markersRef.current.set(place.id, marker);
      } else {
        marker.setPosition({ lat: place.lat, lng: place.lng });
      }
    }

    if (places.length > 0 && !selectedId) {
      const bounds = new maps.LatLngBounds();
      places.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
      map.fitBounds(bounds, 80);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places, ready]);

  // Highlight the selected marker
  useEffect(() => {
    const maps = mapsRef.current;
    if (!ready || !maps) return;
    for (const [id, marker] of markersRef.current) {
      marker.setIcon(pinIcon(maps, id === selectedId));
      marker.setZIndex(id === selectedId ? 999 : 1);
    }
  }, [selectedId, ready, places]);

  // Fly to a requested location
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    map.panTo({ lat: focus.lat, lng: focus.lng });
    if (focus.zoom) map.setZoom(focus.zoom);
  }, [focus, ready]);

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-muted px-6 text-center text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" aria-label="Map of visited places" />;
}
