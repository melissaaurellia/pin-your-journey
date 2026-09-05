# About page — scrapbook style

## What we're building

A new **About** page at `/about`: a static scrapbook page styled like your reference — a bound journal page with items strewn on top (postcard, photos, ticket stubs, small keepsakes) and an introduction text about what Pin There Done That is.

## Changes

### 1. New route: `src/routes/about.tsx`
- Static content only — no database reads, no server functions, no auth.
- Own `head()` metadata: title "About — Pin There Done That", description, og:title/description (no og:image unless we generate a hero we can serve from an absolute URL).
- Layout inspired by your reference image:
  - Parchment journal page, slightly rotated, with the existing paper/postcard texture utilities.
  - A big serif title (e.g. "About this map") at the top.
  - Introduction text in the handwritten (Biro Script) style: what the project is — Melissa's personal field map of places she's been, pinned so friends can browse her recommendations instead of asking twice. (I'll write a first draft; you can rewrite it freely.)
  - Scrapbook items scattered over and around the text at slight random tilts: a vintage postcard, a photo print or two, a ticket stub, a stamp, dried-fruit/keepsake pieces — reusing the existing `stamp-frame`, `photo-print`, `masking-tape`, `postmark` utilities plus generated transparent PNGs.
- Fully responsive: items stack/reflow on mobile, no horizontal overflow, no fixed heights.

### 2. Generated scrapbook assets (swappable later)
- Generate ~4–6 transparent PNG items in the same collage style as your reference: vintage postcard, ticket stub, postage stamp, small photo print, dried orange/fig slice, paper scrap.
- Uploaded via `lovable-assets` as `.asset.json` pointers and imported in the about page, so you can hand me real assets later and I swap the pointers — no layout change needed.

### 3. Header change in `src/routes/index.tsx`
- The "My pins" header button becomes **"About"** (same luggage-tag styling) linking to `/about`.
- Add a small, discreet manage link for you: a tiny "sign in / manage" link in the page footer area (or bottom of the list), visually quiet, still ≥44px touch target.
- The two in-list "My pins" links (empty state at line ~288) stay pointing to `/manage` — they only show to you when logged in.

### 4. Manage page unchanged
`/manage` keeps working exactly as today, reachable via the small link or directly.

## Deliberately not doing
- No changes to the map, pins, filters, recommender, or place panel.
- No new backend tables or auth changes.
- Desktop layout and travel-journal style preserved; the about page extends it.
