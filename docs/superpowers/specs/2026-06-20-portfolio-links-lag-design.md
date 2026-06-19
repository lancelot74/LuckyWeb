# Portfolio links + Jijie card + work-band lag — design

**Date:** 2026-06-20
**Status:** Approved (brainstorming) → ready for implementation plan
**Builds on:** 2026-06-18-jianran-portfolio-design.md

## Context

LuckyWeb's "Selected work" band (`.work-feature`, a 2-column grid on `index.html` and
`work.html`) currently holds 5 featured cards: Bluefin, SooPork, Zielo, Etuga, 简然建材 JianRan.
Each card autoplays a silent looping preview clip when it scrolls ≥50% into view
(`js/work-preview.js`, via `js/lib/preview.js#shouldPlay`); a CSS rule
(`.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}`) makes JianRan (the odd 5th card)
span full width.

Four changes requested:

1. The **Etuga** card should link to `etuga.mn` instead of `https://luckywebtemplate.org`.
2. Add a **Jijie Wood Flooring** card (the user's live site `https://jijiewoodflooring.com`).
3. The **JianRan** card is too big — return it to normal size.
4. The site **feels laggy** — optimize.

## Goals / decisions

| Item | Decision |
|---|---|
| Etuga link | `href` → `https://etuga.mn` on both pages (keep `target="_blank" rel="noopener"`, everything else unchanged) |
| Jijie card | **Featured** (both pages) with screenshot + scroll-through clip, like JianRan |
| Jijie name / category | `Jijie Wood Flooring` / `Flooring` |
| Jijie link | `https://jijiewoodflooring.com` (external, `target="_blank" rel="noopener"`) |
| JianRan size | Normal — **remove** the full-width odd-trailing rule (with a 6th card the grid is a clean 3×2; removing it guarantees no oversized card) |
| Lag | Cap work-band playback to the **single most-visible card** at a time |

## Non-goals

- No changes to the hero, the other four cards (beyond Etuga's href), or the "More work" grid.
- No re-encoding of existing clips; no new dependencies (Playwright stays `--no-save`).
- No bilingual/Chinese name for Jijie (English "Jijie Wood Flooring").

## Design

### 1. Etuga link (`index.html`, `work.html`)

Change `href="https://luckywebtemplate.org"` → `href="https://etuga.mn"` in the Etuga card on both
pages. The card's `data-loop`, image, name (`Etuga`), and category (`Guesthouse`) are unchanged.
(Note the two files differ only in the Etuga `<img alt>` text — edit each precisely.)

### 2. Remove the full-width rule (`css/styles.css`)

Delete the line `.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}` (added for the 5-card
layout). With 6 cards the grid is an even 3×2; JianRan and Jijie are normal half-width cards.

### 3. Add the Jijie card

**Assets** (16:10, to match `.wcard .card-media`), captured from the live site with Playwright +
ffmpeg (same pipeline as JianRan):
- `images/jijie.png` — homepage screenshot (resting image).
- `assets/work/jijie.webm` + `assets/work/jijie.mp4` — short (~6–8s) silent scroll-through clip,
  encoded small (≈300–900KB each). No `.jpg` (unused by the loader).

**Markup** — append as the last card in `.work-feature` on BOTH pages:

```html
<a class="card wcard r" href="https://jijiewoodflooring.com" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jijie"><img src="images/jijie.png" alt="Jijie Wood Flooring website"></div><div class="card-meta"><span class="card-name">Jijie Wood Flooring</span><span class="card-cat">Flooring</span></div></a>
```

### 4. Lag fix — single-active preview (`js/work-preview.js` + `js/lib/preview.js`)

**Root cause:** `work-preview.js` gives each card its own `IntersectionObserver` and plays any card
whose ratio ≥ 0.5. In a 2-column grid, 2–4 (soon up to 6) clips decode/render simultaneously while
the work band is on screen — the source of the lag.

**Fix:** coordinate all `.card-media[data-loop]` so **at most one** video plays — the most-visible
card above a minimum ratio; all others pause and show their static image.

- Add a pure helper to `js/lib/preview.js`:
  `indexOfMostVisible(ratios, min)` → index of the highest ratio that is `>= min`, or `-1` if none.
  (Ties resolve to the first/lowest index. Keep the existing `shouldPlay` export — still unit-tested.)
- In `work-preview.js`: keep one `IntersectionObserver` (threshold `[0,0.25,0.5,0.75,1]`) over all
  preview cards; maintain a `ratios[]` array keyed by card index; on each callback compute
  `indexOfMostVisible(ratios, 0.5)` and play that card (`.playing` + `video.play()`), pausing every
  other card. Preserve the existing per-video `error` → fall-back-to-image behavior and the
  `prefers-reduced-motion` skip.

**Verification of the win:** with the work band on screen, confirm only one `.card-media.playing`
exists at a time (was up to 4). Confirm the hero is not a separate lag source (it was already
optimized: scrub 0.3, in-place particles, async frame decode).

## Verification

- `npm test` passes, including new unit tests for `indexOfMostVisible` (empty, all-below-min,
  single, tie, max-not-first).
- Both pages, desktop (1440×900) + mobile (390×844): 6 featured cards in a clean grid (3×2 desktop,
  1-col mobile), no oversized card, no horizontal overflow.
- Etuga card opens `https://etuga.mn`; Jijie card opens `https://jijiewoodflooring.com` (new tab).
- Scrolling the work band: at most one preview clip plays at once.

## Constraints & risks

- Capturing `jijiewoodflooring.com` needs the lazy content loaded before screenshot/scroll (slow
  scroll + waits), same as the JianRan capture.
- Throwaway capture/verify scripts and Playwright must not be committed (`--no-save`).
- GitHub push remains user-gated (handed off via `!`).
