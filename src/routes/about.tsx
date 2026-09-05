import { createFileRoute, Link } from "@tanstack/react-router";

import ptdLogoAsset from "@/assets/ptd-logo.png.asset.json";
import postcardAsset from "@/assets/scrapbook-postcard.png.asset.json";
import ticketAsset from "@/assets/scrapbook-ticket.png.asset.json";
import fruitAsset from "@/assets/scrapbook-fruit.png.asset.json";
import stampAsset from "@/assets/scrapbook-stamp.png.asset.json";
import tagAsset from "@/assets/scrapbook-tag.png.asset.json";
import demoViewpoint from "@/assets/demo-viewpoint.jpg";
import demoRamen from "@/assets/demo-ramen.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Pin There Done That" },
      {
        name: "description",
        content:
          "The story behind Pin There Done That — Melissa's personal field map of places worth returning to, pinned with notes and photos so friends can explore for themselves.",
      },
      { property: "og:title", content: "About — Pin There Done That" },
      {
        property: "og:description",
        content:
          "A personal world map of tried-and-tested places, kept like a scrapbook so recommendations never get lost.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="parchment relative min-h-dvh overflow-x-clip">
      {/* Header */}
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label="Back to the map">
          <img
            src={ptdLogoAsset.url}
            alt="Pin There Done That logo"
            className="size-11 shrink-0 drop-shadow-sm md:size-12"
          />
          <div className="min-w-0">
            <p className="truncate font-display text-[22px] leading-none tracking-tight md:text-3xl">
              Pin There Done That
            </p>
            <p className="typed mt-1 hidden truncate text-[9px] uppercase tracking-normal text-muted-foreground min-[360px]:block md:text-[11px]">
              A field map of Melissa's travel
            </p>
          </div>
        </Link>
        <Link
          to="/"
          className="typed inline-flex min-h-[44px] shrink-0 items-center rounded-md border border-dashed border-border bg-background/70 px-3 text-[11px] uppercase tracking-wide text-foreground shadow-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]"
        >
          Back to the map
        </Link>
      </header>

      {/* Scrapbook page */}
      <main className="relative mx-auto w-full max-w-4xl px-4 pb-24 pt-4 md:pt-8">
        {/* Floating keepsakes around the page (decorative) */}
        <img
          src={tagAsset.url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute -left-2 top-24 z-10 w-20 -rotate-12 opacity-95 drop-shadow-md md:left-6 md:w-28"
        />
        <img
          src={fruitAsset.url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute -right-3 top-40 z-10 w-24 rotate-12 drop-shadow-md md:right-4 md:w-36"
        />
        <img
          src={stampAsset.url}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute right-6 top-2 z-10 hidden w-16 rotate-6 drop-shadow-md sm:block md:w-20"
        />

        {/* The journal page */}
        <div className="postcard relative rotate-[-0.4deg] rounded-2xl px-5 py-8 sm:px-10 md:px-14 md:py-12">
          {/* Binder holes down the left edge */}
          <div
            aria-hidden="true"
            className="absolute inset-y-6 left-2 hidden w-4 flex-col justify-between sm:flex"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <span
                key={i}
                className="size-3 rounded-full border border-border bg-background shadow-inner"
              />
            ))}
          </div>

          <div className="sm:pl-6">
            <p className="postmark inline-block px-3 py-1 text-[10px]">Field notes · est. 2026</p>
            <h1 className="mt-4 text-4xl leading-tight tracking-tight md:text-5xl">
              About this map
            </h1>

            {/* Postcard with the intro */}
            <div className="relative mt-8">
              <div className="relative mx-auto max-w-md rotate-1">
                <img
                  src={postcardAsset.url}
                  alt="A blank vintage postcard"
                  loading="lazy"
                  className="w-full drop-shadow-lg"
                />
                <p className="handwritten absolute inset-x-[12%] top-[30%] text-lg leading-snug md:text-xl">
                  chasing good food,
                  <br />
                  quiet views &amp; places
                  <br />
                  worth going back to
                </p>
              </div>
              <span
                aria-hidden="true"
                className="masking-tape absolute -top-2 left-1/2 h-6 w-24 -translate-x-1/2 -rotate-2"
              />
            </div>

            <div className="mt-10 max-w-prose space-y-5">
              <p className="handwritten text-xl leading-relaxed">
                Hi, I'm Melissa. I travel a lot, and friends kept asking the same
                question: "you were just there — where should I go?" So instead of
                retyping the same list of ramen bars, viewpoints and wine cellars
                into chat after chat, I started pinning everything here.
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                Every pin on the map is a place I've actually been — with a note
                from my journal, a photo I took, and the date I visited. Browse
                the map, filter by country or vibe, or let the surprise button
                pick somewhere for you. If a place is pinned, it comes
                recommended. That's the whole rule.
              </p>
            </div>

            {/* Photo strip + keepsakes */}
            <div className="mt-12 flex flex-wrap items-end gap-6 md:gap-10">
              <figure className="relative -rotate-2">
                <div className="photo-print">
                  <img
                    src={demoViewpoint}
                    alt="A viewpoint from Melissa's travels"
                    loading="lazy"
                    className="film-photo h-36 w-32 object-cover md:h-44 md:w-40"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="masking-tape absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 rotate-3"
                />
                <figcaption className="handwritten mt-1 text-center text-sm">
                  the viewpoint
                </figcaption>
              </figure>

              <figure className="relative rotate-2">
                <div className="photo-print">
                  <img
                    src={demoRamen}
                    alt="A bowl of ramen from Melissa's travels"
                    loading="lazy"
                    className="film-photo h-36 w-32 object-cover md:h-44 md:w-40"
                  />
                </div>
                <span
                  aria-hidden="true"
                  className="masking-tape absolute -top-2 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-3"
                />
                <figcaption className="handwritten mt-1 text-center text-sm">
                  still dreaming of this
                </figcaption>
              </figure>

              <img
                src={ticketAsset.url}
                alt="A saved ticket stub"
                loading="lazy"
                className="w-40 -rotate-3 drop-shadow-md md:w-52"
              />
            </div>

            <div className="mt-12 border-t border-dashed border-border pt-6">
              <p className="typed text-[11px] uppercase tracking-wide text-muted-foreground">
                This site is read-only on purpose — new pins appear whenever I get
                back from somewhere.
              </p>
              <Link
                to="/"
                className="typed mt-4 inline-flex min-h-[44px] items-center rounded-md border border-dashed border-border bg-background/70 px-4 text-[11px] uppercase tracking-wide shadow-sm transition-colors hover:bg-foreground/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:scale-[0.98]"
              >
                Explore the map
              </Link>
            </div>
          </div>
        </div>

        <footer className="mt-10 flex items-center justify-center gap-4">
          <span className="typed text-[10px] uppercase tracking-wide text-muted-foreground">
            Pin There Done That
          </span>
          <Link
            to="/manage"
            className="typed inline-flex min-h-[44px] items-center px-2 text-[10px] uppercase tracking-wide text-muted-foreground/70 underline-offset-4 transition-colors hover:text-muted-foreground hover:underline"
          >
            manage
          </Link>
        </footer>
      </main>
    </div>
  );
}
