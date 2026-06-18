# LuckyWeb — Mobile / phone-hero design

**Date:** 2026-06-18
**Status:** Approved (brainstorming) → ready for implementation plan
**Builds on:** 2026-06-17-luckyweb-hub-redesign-design.md

## Context / problem

The hub redesign shipped a cinematic desktop hero: a **landscape** laptop whose
screen builds a website, driven by a pinned scroll-scrub image sequence
(`assets/hero/frame-001..121.webp`). On phones, `js/hero.js` falls back to a
looping copy of the **landscape** `hero.mp4` / `hero.webm` rendered in a `100svh`
portrait frame with `object-fit:cover; object-position:center bottom`. A 16:9
laptop shot cropped into a tall portrait viewport shows only a narrow center-bottom
slice — the laptop is lost and the composition reads as broken on a phone.

The rest of the site reflows through existing breakpoints (680 / 760 / 480px) but
has never been checked on a real phone.

## Goals

1. A **new portrait (9:16) Higgsfield video** purpose-built for phones: a
   **smartphone** whose screen assembles the site, in the same dark / cinematic /
   ember (`#C7451B`) language as the desktop laptop hero.
2. Wire that video into the mobile hero as an **autoplay loop** (muted, inline).
3. **Targeted** mobile polish on the obvious phone issues (nav, type scale,
   spacing, tap targets, form width). Not a full audit.

## Non-goals

- No exhaustive per-section / per-page mobile audit; no real-device matrix.
- No change to the **desktop** hero (laptop scroll-scrub stays as-is).
- No new dependencies; the site stays zero-build static.
- `work.html` gets only incidental fixes (shared CSS), not a dedicated pass.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Video subject | **Phone** building/scrolling the site (portrait-native) |
| Aspect ratio | **9:16** portrait |
| Mobile hero behavior | **Autoplay loop** (muted, `playsinline`, `loop`) |
| Production method | **Image-to-video** (Approach A): still → Seedance 2.0 |
| Scope | **Hero + targeted fixes** |

## Design

### 1. The video asset

**Production (Approach A — image-to-video):**
1. Generate a portrait still via Higgsfield (GPT Image 2 / product-photoshoot):
   a modern smartphone standing/leaning on a dark reflective surface, single warm
   ember (`#C7451B`) rim light, deep charcoal (`#16140F`) background, screen
   off/dim — matching the desktop laptop hero's lighting and palette.
2. Animate that still with **Seedance 2.0**, **9:16**, ~5s, 1080p upscale: the
   screen assembles the site (UI blocks fade/slide in, a short scroll) with a slow
   push-in / subtle parallax.

**Outputs (local, no hot-linking):**
- `assets/hero/hero-phone.webm` and `assets/hero/hero-phone.mp4` (ffmpeg encode).
- `assets/hero/hero-phone-poster.webp` — first (dark) frame, used as the video
  `poster` and the reduced-motion static fallback.

**Loop:** muted + `playsinline` + `loop`. Motion shaped so start ≈ end state to
soften the reset; a hard cut at the loop point is inherent and accepted.

### 2. Mobile hero wiring (`js/hero.js` + `css/styles.css`)

- The desktop scrub path (`initScrub`, pinned frames) is unchanged.
- In the existing mobile / no-GSAP branch of `initHero` (currently
  `js/hero.js:21`), **only when `isMobile`**, swap `.hero-video` to the portrait
  sources and set its poster to `hero-phone-poster.webp` **before** `play()`. The
  HTML keeps the landscape sources so a *desktop* no-GSAP fallback still shows the
  laptop.
  - Implementation note: replace the `<source>` elements (or set `video.src`) then
    `video.load()` before `play()`; keep the existing `.catch()` → poster fallback.
- CSS `@media (max-width:760px)`: `.hero-video{object-position:center}` to override
  the laptop's `center bottom` so the phone is centered in the frame. Keep the
  existing `.hero::after` gradient so the headline stays legible over the video.
- Reduced motion: existing `reduce` path shows the poster; ensure the mobile poster
  is the portrait one.

### 3. Targeted responsive fixes (`css/styles.css`)

Current values noted so the plan is grounded; each is a small, surgical change.

- **Nav pill** (`.nav`, `@media max-width:680px`): tighten gap/padding so brand +
  "Start a project" CTA + 4-language toggle fit down to ~360px without wrapping or
  overflowing `calc(100vw - 32px)`.
- **Language buttons** (`.lang button`, currently `padding:4px`): enlarge hit area
  to ≥44px target height (visual size can stay small via padding/min-height).
- **Hero headline** (`.hero-h1`, currently `clamp(58px,12.5vw,168px)`): lower the
  clamp floor (≈46–50px) so it never overflows ~320–360px screens; verify
  `max-width:14ch` + `line-height:.9` don't clip.
- **Vertical rhythm** (`.section` `padding:84px 0`): reduce on mobile (≈56px) so
  sections aren't oversized on a phone.
- **Hero inner padding** (`.hero-inner`): confirm top/bottom padding leaves the
  looping phone video visible and the stats block uncrowded when stacked.
- **Contact form / work cards:** confirm comfortable full-width and spacing in the
  1-column mobile layout (`@media max-width:760px` / `480px`).

### 4. Verification

- Emulate **iPhone (390×844)** and a **small Android (360×640)**: portrait video
  fills the hero, headline/stats legible over it, **no horizontal scroll**, tap
  targets ≥44px, nav fits. Screenshot the hero + one mid-page section.
- `npm test` stays **24/24** (pure-logic libs unaffected by hero/CSS wiring).
- Confirm desktop is visually unchanged (laptop scrub still pins/builds).

## Constraints & risks

- **Higgsfield connectivity:** the MCP has been connecting/disconnecting this
  session. Generation requires it up; check credit **balance** before spending.
  If generation is blocked, the wiring + responsive fixes can land first and the
  asset dropped in after.
- **Loop seam:** a simple looping `<video>` has a visible reset; accepted.
- **Zero-build / local assets / no new deps** must hold.

## Success criteria

- A phone visitor sees a portrait phone-building-the-site video filling the hero,
  looping smoothly, with legible overlaid copy and no layout breakage.
- Nav, type, spacing, and tap targets are comfortable at 360–390px wide.
- Desktop hero and all 24 unit tests are unchanged.
