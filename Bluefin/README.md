# Bluefin — Cuisine d'Art

A redesign of the Bluefin restaurant page (Ulaanbaatar, Mongolia) on the
**Deep Ocean / "Descent"** concept: the page sinks from the shimmering surface
(hero) down through darker water as you scroll, surfacing at the reservation CTA.

## Structure

```
index.html          markup
css/styles.css      Deep Ocean design system
js/ocean.js         ambient canvas — bioluminescent particles + god-ray shafts
js/main.js          nav, scroll reveals, depth meter, animated stats, dish swapper
assets/video/       hero loop (mp4 + webm) + poster
assets/img/         dish + interior imagery
```

Plain static files — no build step. Open `index.html` directly or serve the folder.

## Assets

All imagery and the hero video are **owned, locally-stored assets generated with
Higgsfield AI** (no external hot-linking). Generated 2026-06-14.

- `assets/video/hero-ocean.mp4` / `.webm` — Seedance 2.0, photoreal hero: a bluefin tuna school under sun-shafts that dissolves into the warm hinoki sushi counter (5s loop, 16:9)
- `assets/video/sushi-cut.mp4` — Seedance 2.0, a yanagiba slicing bluefin nigiri; **scrubbed to scroll** in the Craft section (all-keyframe encode for smooth seeking)
- `assets/img/dish-*.webp` — GPT Image 2, signature dish photography
- `assets/img/space-*.webp` — GPT Image 2, interior / ambiance shots

Restaurant data (name, address, hours, ratings, reviews, menu) is real, carried
over from the original page.

## Accessibility

Respects `prefers-reduced-motion`: the ambient canvas renders a single static
frame, the hero video falls back to its poster, and scroll reveals appear instantly.
