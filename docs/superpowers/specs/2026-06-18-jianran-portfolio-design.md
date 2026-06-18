# Add JianRan to the LuckyWeb portfolio — design

**Date:** 2026-06-18
**Status:** Approved (brainstorming) → ready for implementation plan

## Context

LuckyWeb's Work section showcases sites the studio built. The **Selected work** band
(`.work-feature`, a 2-column grid) appears on both `index.html` and `work.html` and holds
4 "featured" cards (Bluefin, SooPork, Zielo, Etuga). Each featured card shows a static
screenshot (`images/<name>.png`) and, via `js/work-preview.js`, autoplays a silent looping
scroll-through clip (`assets/work/<name>.{webm,mp4}`) when the card scrolls ≥50% into view
(`.card-media[data-loop]`); if the clip is missing it gracefully falls back to the image.

The user built **简然建材 JianRan** — a live, polished bilingual building-materials & furniture
**sourcing** business site (Foshan, Guangdong) at `https://www.chinabuildingmaterials.store/`
(dark editorial hero, "SOURCED." headline). It should join the portfolio as a featured work.

## Goals

Add JianRan as a **featured** work card — same rich treatment as the other four (static
screenshot + hover/scroll-in preview clip) — on **both** `index.html` and `work.html`, linking
out to the live site.

## Non-goals

- No dedicated internal case-study page (the card links straight to the live site, like Etuga).
- No changes to the existing four featured cards or the "More work" grid.
- No new dependencies; the site stays zero-build static. (Playwright, used only to capture the
  assets, is installed `--no-save` and never committed.)

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Placement | Featured (`.work-feature`) on both pages |
| Treatment | Static screenshot + scroll-through preview clip (like Bluefin/SooPork/Zielo/Etuga) |
| Display name | `简然建材 JianRan` |
| Category tag | `Building materials` |
| Link | `https://www.chinabuildingmaterials.store/` (external, `target="_blank" rel="noopener"`) |
| Clip source | Captured from the live site (Playwright scroll recording), not synthetic |

## Design

### Assets (16:10, to match `.wcard .card-media{aspect-ratio:16/10}`)

- `images/jianran.png` — static screenshot of the live homepage; the card's resting image.
- `assets/work/jianran.webm` + `assets/work/jianran.mp4` — a short (~6–8s) **silent** scroll-through
  clip captured from the live site, encoded small (target ≈300–700KB each, in line with the
  existing `soopork`/`zielo`/`etuga` clips). No `.jpg` is produced — `work-preview.js` does not use it.

### Capture method

Use Playwright (Chromium, already cached; package installed `--no-save`) to load the live site at a
16:10 desktop viewport (1440×900), let lazy content load, then:
1. Take a full-viewport screenshot → `images/jianran.png`.
2. Record a video while smoothly scrolling top→bottom over a few seconds → encode with ffmpeg to
   `assets/work/jianran.webm` (VP9) and `.mp4` (H.264, faststart), audio stripped, ~16:10.

### Markup

Append this card to the `.work-feature` grid in BOTH `index.html` and `work.html`:

```html
<a class="card wcard r" href="https://www.chinabuildingmaterials.store/" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jianran"><img src="images/jianran.png" alt="简然建材 JianRan website"></div><div class="card-meta"><span class="card-name">简然建材 JianRan</span><span class="card-cat">Building materials</span></div></a>
```

It goes **last** in the grid (newest work closes the set).

### 5-card grid layout

`.work-feature` is `grid-template-columns:repeat(2,1fr)`. A 5th card otherwise leaves a lone
half-width card in the last row. Add one CSS rule so an odd trailing featured card spans the full
width, reading as an intentional wide closing feature:

```css
.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}
```

(Mobile is already single-column `@media (max-width:760px)`, so this only affects ≥760px.)

## Verification

- Screenshot `index.html` and `work.html` at desktop (1440×900) and mobile (390×844): the JianRan
  card renders, sits full-width as the trailing featured card on desktop, single-column on mobile.
- Confirm the preview clip autoplays when the card scrolls into view and the static image shows otherwise.
- Confirm the card links to `https://www.chinabuildingmaterials.store/` in a new tab.
- `npm test` stays **24/24** (no logic touched).
- No horizontal overflow; existing four cards unchanged.

## Constraints & risks

- Capturing a Squarespace site requires waiting for lazy-loaded imagery before screenshot/scroll;
  the capture script must scroll slowly and pause for load.
- Zero-build / local-assets / no committed dev deps must hold (Playwright `--no-save`; any capture
  script is a throwaway, not committed).
- GitHub push remains user-gated (handed off via `!`).
