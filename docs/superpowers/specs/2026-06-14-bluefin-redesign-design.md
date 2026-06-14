# Bluefin — "Descent" Redesign

**Date:** 2026-06-14
**Status:** Approved (design), proceeding to build
**Repo:** LuckyWeb (`github.com/lancelot74/LuckyWeb`)

## Summary

Replace the standalone `bluefin.html` with a multi-file folder `Bluefin/` containing a
full redesign of the Bluefin — Cuisine d'Art restaurant page. New aesthetic direction:
**Deep Ocean / Bluefin**. Imagery moves from fragile hot-linked TripAdvisor CDN URLs to
**owned, locally-stored Higgsfield-generated assets** (one underwater hero video loop + a
signature dish image set). Animations are upgraded to a thematic ocean motion system.

## Decisions (from brainstorming)

- **Scope:** Full redesign — new structure, sections, and storytelling (not a media-swap).
- **Aesthetic:** Evolve away from "Edo Noir" gold/crimson → **Deep Ocean / Bluefin**.
- **Higgsfield assets:** 1 underwater hero video + ~5 signature dish images.
- **Workflow:** Write & commit spec, then build end-to-end (no review-gate pause).
- **Data:** Preserve the real restaurant data from the existing `bluefin.html`.

## Concept

A **descent into the deep**. The page opens at the shimmering surface (hero) and as the
user scrolls they sink through progressively darker, quieter water — each section a layer
of depth — resurfacing at the reservation CTA. This single motion idea unifies the name,
the palette, and the omakase storytelling.

## Architecture / File Structure

```
Bluefin/
  index.html              semantic markup only
  css/styles.css          design system (tokens, layout, all section styles)
  js/main.js              nav, scroll reveals, parallax, menu/dish interactions
  js/ocean.js             canvas caustics + bioluminescent particle field
  assets/
    video/
      hero-ocean.mp4      Higgsfield underwater loop (primary)
      hero-poster.jpg     first-frame poster / reduced-motion fallback
    img/
      dish-*.webp         Higgsfield signature dish set (owned, high-res)
    brand/
      seal.svg            refined Bluefin mark
  README.md               asset provenance + credits
```

Each unit has one job: `ocean.js` owns the ambient WebGL/canvas effects and exposes a
small init/destroy API; `main.js` owns DOM interaction; `styles.css` owns presentation;
`index.html` is content-only. They communicate through DOM hooks and CSS custom
properties — each can be understood and changed without reading the others' internals.

### Hub integration
- Update `index.html:1196`: link `bluefin.html` → `Bluefin/`.
- Delete the old standalone `bluefin.html`.
- Keep `images/bluefin.png` as the hub card thumbnail (optionally refresh later).

## Design System — Deep Ocean

| Token | Value | Use |
|-------|-------|-----|
| `--abyss` | `#03070D` | page background (deepest) |
| `--deep` | `#0A2A3F` | section backgrounds, panels |
| `--teal` | `#0E5C6B` | borders, secondary surfaces |
| `--biolum` | `#38E1D6` | primary accent (links, CTAs, glow) |
| `--foam` | `#EAF6F8` | primary text |
| `--mute` | `#5B7C8A` | muted text / captions |
| `--ember` | `#E8995A` | warm accent, used sparingly (prices, tuna) |

**Type:** Cormorant Garamond (display serif) · Inter (body/UI) · Shippori Mincho B1
(Japanese accents). A background "depth gradient" darkens from `--deep` near the surface to
`--abyss` at the bottom, reinforcing the descent.

## Sections

1. **Surface / Hero** — fullscreen Higgsfield underwater video loop, drifting cyan light,
   restaurant name + "Cuisine d'Art · Ulaanbaatar," scroll-to-descend cue.
2. **The Descent / About** — parallax depth layers; the Bluefin story; ambient light dims.
3. **The Catch / Craft** — sourcing & artistry (bluefin tuna, knife work); animated stat
   counters (e.g. "#14 of 407").
4. **Signature Dishes** — Higgsfield dish set in interactive cards (hover → detail).
   Replaces all hot-linked dish photos with owned high-res images.
5. **Menu** — real menu items, refined typographic treatment.
6. **The Space** — ambiance; reuses existing interior shots (no HF interiors this pass),
   restyled to the ocean palette.
7. **Reviews** — real reviews, restyled.
8. **Visit / Reservation** — hours, location/map, reservation CTA — the resurfacing moment.

## Motion System ("better animations")

- **`ocean.js`** — animated water-caustics light overlay + bioluminescent drifting
  particle field on `<canvas>`, GPU-friendly, capped DPR; replaces the old Three.js hero.
- **Depth parallax** — layers translate at different scroll rates to simulate sinking.
- **Scroll reveals** — IntersectionObserver, refined easing, staggered.
- **Hero video** — subtle scroll parallax over the looping clip.
- **Accessibility** — full `prefers-reduced-motion` path: static `hero-poster.jpg`,
  particles/caustics disabled, reveals become instant. No motion required to read content.

## Higgsfield Generation Plan

Available credits at design time: **1,810**.

- **Hero video (1):** cinematic underwater scene — drifting light shafts, slow particle
  motion, deep teal→abyss gradient, seamless ~5–8s loop. Generated via Higgsfield
  (image→video for compositional control where useful). **Confirm exact credit cost
  before generating the video.**
- **Dish images (~5):** otoro nigiri, sashimi moriawase, a signature maki roll, a hot
  signature plate, and a dessert/plated art piece — consistent dark moody lighting on
  slate, high-res. Generated via Higgsfield image model, then downloaded.
- All outputs are **saved locally** under `Bluefin/assets/` (owned, no hot-linking).
  Provenance recorded in `Bluefin/README.md`.

## Data Source

Real restaurant data (name, "#14 of 407," hours 12:00–00:00, Ulaanbaatar address/contact,
menu items, review quotes) is extracted from the current `bluefin.html` and preserved —
only the presentation changes.

## Fallbacks / Error Handling

- Video: `<video>` with `poster`, `muted`, `loop`, `playsinline`, `autoplay`; poster shows
  if the clip fails or autoplay is blocked.
- Images: `loading="lazy"`, explicit dimensions to avoid layout shift; descriptive `alt`.
- Reduced motion: as above.
- No build tooling — plain static files, openable directly and servable as-is (matches the
  rest of the repo).

## Success Criteria

1. `Bluefin/` folder exists with split `index.html` / `css` / `js` / `assets`; old
   `bluefin.html` removed; hub link updated and working.
2. No external image hot-links remain for the hero and signature dishes (owned assets).
3. Deep Ocean aesthetic applied across all sections; real data preserved.
4. Ocean motion system runs smoothly and degrades cleanly under `prefers-reduced-motion`.
5. Page renders correctly opened locally in a browser.

## Build Order

1. Extract real data from existing `bluefin.html`.
2. Generate Higgsfield dish images; generate hero video (after credit confirmation).
3. Download/store assets into `Bluefin/assets/`.
4. Build `index.html`, `css/styles.css`, `js/main.js`, `js/ocean.js`, `README.md`.
5. Update hub link in `index.html`; delete old `bluefin.html`.
6. Verify in browser; commit locally (push handed to user — remote push is blocked here).
