/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps-loader";
import type { PublicPlace } from "@/lib/places.functions";

// Ink-on-paper map: cream land, watercolour water, hairline hand-inked roads.
const MAP_STYLE: any[] = [
  { elementType: "geometry", stylers: [{ color: "#f4eedd" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a4034" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#fbf7ec" }, { weight: 3 }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#a2937a" }, { weight: 1 }],
  },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dde5c8" }] },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#9a8c76" }, { weight: 0.9 }],
  },
  { featureType: "road.arterial", elementType: "geometry.fill", stylers: [{ color: "#fffdf6" }] },
  { featureType: "road.highway", elementType: "geometry.fill", stylers: [{ color: "#f6dfae" }] },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#4a4034" }, { weight: 1.2 }],
  },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#f4eedd" }] },
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#efe7d3" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bcd9e4" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#6b8791" }] },
];

// Wobbly, hand-inked pin outline (deliberately imperfect curves).
const PIN_PATH =
  "M12 0.8C6.6 0.6 2.5 4.6 2.6 9.4c0.1 3.4 2.1 7 4.4 10.1 1.6 2.1 3.4 4 4.9 5.7 1.6-1.8 3.6-3.9 5.2-6.2 2.2-3.1 4-6.5 4.1-9.7C21.3 4.5 17.3 1 12 0.8z";

function pinIcon(maps: any, active: boolean) {
  return {
    path: PIN_PATH,
    fillColor: active ? "#a8461d" : "#c26433",
    fillOpacity: active ? 1 : 0.92,
    strokeColor: "#3b3129",
    strokeWeight: 1.6,
    scale: active ? 1.55 : 1.15,
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

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div
        ref={containerRef}
        className="h-full w-full map-ink"
        aria-label="Map of visited places"
      />
      {/* paper grain + soft edge wash, purely decorative */}
      <div className="map-paper pointer-events-none absolute inset-0" aria-hidden="true" />
      <div className="map-vignette pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  );
}

