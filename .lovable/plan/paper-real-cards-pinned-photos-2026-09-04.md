# Paper-Real Cards & Pinned Photos

Goal: make the place cards and the opened postcard feel like real objects on a desk — textured paper, photos physically attached with pins, clips and tape.

## What you'll see

- **Textured paper cards.** Your uploaded paper texture becomes the card surface, tiled seamlessly. Layered drop shadows plus a faint edge-curl gradient give real 3D depth, and each card keeps its slight random tilt.
- **Photos attached for real.** Each photo gets one attachment, picked per place so it feels like a real pinboard: your red pushpin, the silver bulldog clip, the safety pin, or a semi-transparent masking-tape strip (rendered in CSS). Each attachment casts its own small shadow onto the photo.
- **Same treatment in both places:** the small cards in the side list and the big postcard that opens on click.
- **The map stays exactly as it is.**

## How it works (technical)

1. Upload the 4 images as CDN assets: paper texture (JPEG, cropped to a seamless tile), pushpin, bulldog clip, safety pin (transparent PNGs).
2. `src/styles.css`:
   - `paper-card` utility: texture background + layered shadows + subtle inner edge shading.
   - `masking-tape` utility: translucent amber strip with slight rotation and shadow.
   - Keep existing `stamp-frame` (photo stamp border) and `film-photo` unchanged — attachments layer on top.
3. `src/components/decor.tsx`: new `PhotoAttachment` component that takes a variant (`pin | clip | safety | tape`) and renders the right asset positioned at the photo's top edge with a drop shadow.
4. `src/routes/index.tsx` (list cards) and `src/components/PlacePanel.tsx` (postcard): apply `paper-card` to the card surface and render `PhotoAttachment` over each photo, variant chosen deterministically from the place id so it doesn't reshuffle on every render.
5. Verify visually with screenshots in both the list and the opened postcard, checking shadows, positioning and texture seams.
