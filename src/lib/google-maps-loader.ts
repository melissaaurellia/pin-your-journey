/* eslint-disable @typescript-eslint/no-explicit-any */
let loadPromise: Promise<any> | null = null;

export function loadGoogleMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser only"));

  const w = window as any;
  if (w.google?.maps) return Promise.resolve(w.google.maps);
  if (loadPromise) return loadPromise;

  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"];

  if (!key) return Promise.reject(new Error("Google Maps key is missing"));

  loadPromise = new Promise((resolve, reject) => {
    const callbackName = "__pinThereMapsReady";
    w[callbackName] = () => resolve(w.google.maps);

    const script = document.createElement("script");
    const params = new URLSearchParams({
      key,
      loading: "async",
      callback: callbackName,
      libraries: "marker",
    });
    if (channel) params.set("channel", channel);
    script.src = `https://maps.googleapis.com/maps/api/js?${params.toString()}`;
    script.async = true;
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Google Maps failed to load"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}
