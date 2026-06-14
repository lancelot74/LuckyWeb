# Bluefin — Cuisine d'Art

A redesign of the Bluefin restaurant page (Ulaanbaatar, Mongolia) on the
**Deep Ocean / "Descent"** concept: the page sinks from the shimmering surface
(hero) down through darker water as you scroll, surfacing at the reservation CTA.

## Structure

```
index.html          markup (incl. entrance shoji-door overlay)
css/styles.css      Deep Ocean design system
js/ocean.js         ambient canvas — bioluminescent particles + god-ray shafts
js/main.js          entrance doors, nav, scroll reveals, depth meter, stats, dish swapper
js/craft.js         pinned "Craft" scroll-story (image-sequence canvas scrub)
assets/video/       hero loop (mp4 + webm) + poster
assets/craft/       120 WebP frames for the Craft scroll-story
assets/img/         dish + interior imagery
```

Plain static files — no build step. Open `index.html` directly or serve the folder.

## Assets

All imagery and the hero video are **owned, locally-stored assets generated with
Higgsfield AI** (no external hot-linking). Generated 2026-06-14.

- `assets/video/hero-ocean.mp4` / `.webm` — Seedance 2.0, photoreal hero: a bluefin tuna school under sun-shafts that dissolves into the warm hinoki sushi counter (5s loop, 16:9)
- `assets/craft/frame-000…119.webp` — the Craft **scroll-story**: a FORM → CUT → PLATE making sequence (three Seedance 2.0 clips stitched, exported to 120 frames) scrubbed frame-by-frame on a `<canvas>` as you scroll the pinned section
- `assets/video/sushi-cut.mp4` — Seedance 2.0 yanagiba slice; the middle beat (source clip) of the Craft scroll-story reel
- `assets/img/dish-*.webp` — GPT Image 2, signature dish photography
- `assets/img/space-*.webp` — GPT Image 2, interior / ambiance shots

Restaurant data (name, address, hours, ratings, reviews, menu) is real, carried
over from the original page.

## Accessibility

Respects `prefers-reduced-motion`: the ambient canvas renders a single static
frame, the hero video falls back to its poster, and scroll reveals appear instantly.
