# Pin There Done That

A personal travel map: an interactive world map of the places you've been, with your notes, photos, ratings and tags — plus a voice-driven "tell me what you're in the mood for" recommender that picks from your own pins.

## What visitors see

**Home — the map**
- Full-screen interactive world map, draggable and zoomable, on desktop and phone.
- Every place you've saved appears as a pin, clustered when zoomed out.
- Filter bar: tags (food, coffee, bar, hike, hotel...), rating, and a city/place search box.
- A big "Surprise me" button that opens the voice recommender.

**Tapping a pin**
- A panel slides up (phone) or in from the side (desktop) with: place name, city, your rating, your tags, your written note, and a photo gallery you can swipe through — Instagram-story style.
- Live details fetched at open time: address, opening hours, current rating, an official Google Maps link, and the place's website when it has one.

**Voice recommender**
- Press and hold a record button, say what you feel like ("cheap late-night noodles in Tokyo"), release.
- Speech is turned into text, shown back to you, then matched against your own pins only.
- One place is picked and shown as a card with your note and a "show on map" button. A "roll again" button gives the next-best pick.
- A typed fallback input for anyone who can't or won't use the mic.

## Your private side

- Sign-in page at `/auth` (email + password). Only you can reach the manage area; everything else is public and shareable.
- `/manage`: list of your places, add / edit / delete.
- Add-a-place form: search for the place by name (autocomplete), which locks in the exact location, then add your rating, tags, note, and upload photos.
- Header shows "Sign in" or your account menu depending on session state.

## About the data source you mentioned

Linkup isn't available as an integration here. For the live place info you described — the Google Maps link, website, hours, current rating — Google Maps Platform is the right source and is available, so I'll use that. If you specifically want Linkup, I can look at wiring it as a manual API key instead; say the word.

## Technical notes

- Lovable Cloud (database, auth, file storage) enabled for places, photos and your login. Single-owner model: one `places` table owned by `auth.uid()`; public `SELECT` for anyone, insert/update/delete restricted to the owner. Photos in a public storage bucket with owner-only writes.
- `places` columns: name, google_place_id, lat, lng, city, country, rating (1–10), tags (text[]), note, visited_on, created_at. Separate `place_photos` table for ordered image URLs.
- Map: Mapbox GL JS (public token via the Mapbox connector) for the interactive globe/map, clustering and smooth mobile gestures. Wheel/pinch zoom handled by the library.
- Google Maps Platform connector via the connector gateway (server-side only) for: place autocomplete + details when adding a place, and live Place Details (website, hours, maps URL) on pin open. Cached per place to keep usage low.
- Voice: browser records audio → server function → Lovable AI speech-to-text → transcript → a Lovable AI call that ranks your pins against the request and returns the best matches with a one-line reason. All AI keys stay server-side.
- TanStack Start routes: `/` (public map, SSR + own head metadata), `/auth`, `/_authenticated/manage`, `/_authenticated/manage/new`, `/_authenticated/manage/$id`. Server functions in `src/lib/*.functions.ts`; public reads use a publishable-key server client, writes go through `requireSupabaseAuth`.
- Design: hand-drawn, warm, travel-journal feel — off-white paper background, ink-dark type, one warm accent, custom pin markers. No default purple-gradient look.

## Build order

1. Enable Cloud; create the `places` / `place_photos` schema, RLS policies, grants, and the photo bucket.
2. Connect Mapbox and Google Maps Platform.
3. Public map page with pins, clustering, filters, and the pin detail panel (live Google details).
4. Auth page + manage area: add/edit/delete places with autocomplete and photo upload.
5. Voice recommender: record → transcribe → match → result card.
6. Mobile polish, SEO metadata, empty states.
