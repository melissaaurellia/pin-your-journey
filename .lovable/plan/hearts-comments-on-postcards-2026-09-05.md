# Hearts & comments on postcards

Let visitors react and leave a signed note on each place, right below the Google Maps button on the big postcard.

## What you'll see

- **Heart button** under the Google Maps / Website buttons, with a live count. One heart per visitor (remembered on their device), tap again to un-heart.
- **A short guestbook form** in the same postcard style: a Name box, a Comment box and a Post button.
- **Posted notes** appear immediately below the form, newest first: name in the typewriter style, comment in the handwritten pen style, and the date it was posted. Everyone visiting the map sees them.
- No account or sign-in needed to heart or comment.

## How it works

1. **Database**: two new tables.
   - `place_reactions` — place, a per-visitor id, created date. One heart per visitor per place enforced by a unique pair. Public read and insert/delete of a heart; no owner data exposed.
   - `place_comments` — place, author name, body, created date. Public read and insert; only you (the pin owner) can delete.
   - Both with grants for anonymous + signed-in visitors, row-level security on, and policies scoped to what's listed above.
2. **Visitor id**: a random id generated once per browser and kept in local storage — no tracking, just so a heart can be undone and not double-counted.
3. **Server functions** in a new `src/lib/engagement.functions.ts`: `getEngagement` (counts + comments for a place), `toggleHeart`, `postComment`. Input validated with zod: name 1–40 chars, comment 1–500 chars, both trimmed; simple rate guard by rejecting empty/oversized input.
4. **UI** in `src/components/PlacePanel.tsx`: a new `PostcardGuestbook` section rendered after the Google Maps/Website row, using React Query for fetching and mutating, with optimistic heart toggling and a "thanks" state after posting. Styling reuses existing `typed`, `handwritten`, `postmark` and dashed-border utilities — no new visual language.

## Notes

- Comments post instantly and publicly. Since anyone can write, I'll cap length, strip HTML, and you can delete anything from the database side later; if you want a delete control on your manage page, say so and I'll add it.
- Map, filters, recommender and the rest of the postcard stay unchanged.
