# LuckyWeb hub redesign — design spec

**Date:** 2026-06-17
**Scope:** Redesign the LuckyWeb studio hub. The existing client case-study pages
(`brooklyncoffee.html`, `Bluefin/`, `soopork.html`, etc.) stay as-is and are linked.
**Goal:** Turn the hub into a studio portfolio that wins clients by *demonstrating
craft*. A device-dominated cinematic hero is the hook; a calm editorial body builds
trust; animated Work previews prove capability. Stays a zero-build static site on
GitHub Pages.

---

## 1. Decisions locked (from the brainstorming walkthrough)

| Decision | Choice |
|---|---|
| Surface | The hub only (`index.html`) |
| Build | Multi-file **static, no build step** (CDN libs allowed) |
| Pages | **Lean 2-page**: Home one-pager + `work.html` |
| Visual direction | **Editorial art-direction** synthesized from 6 Refero refs |
| Hero | **"The transformation"** — scroll-scrubbed dim→alive, full cinematic Higgsfield |
| Animation scope | **Showcase a few**: full hero + ~4 flagship Work previews; rest static |
| Theme/font switchers | **Dropped** — one committed look |
| i18n | **Kept** (the `data-t` translation system) |
| Accent | **Ember `#C7451B`**, used as punctuation only |

### Reference synthesis (the "wow" rationale)
The six picks — Structured, Air, GSAP, Dala, Steep, Ventriloc — share one DNA:
**a single bold signature device + extreme sculptural type + flat confident color +
one decisive accent.** The wow is art direction, not micro-interactions. Each ref maps
to a concrete LuckyWeb move:

- **Structured** → giant serif headline cropped/bleeding off the viewport edge, over a full-bleed image.
- **Air** → frosted-glass depth panels + capsule, ultra-large type.
- **GSAP** → the dark Work band; GSAP+ScrollTrigger+Lenis as the motion engine; mono `/02` & `{ }` labels.
- **Dala** → the hero's dark start state is an **ember particle ambient** field (reuse the canvas particle tech from `Bluefin/js/ocean.js`).
- **Steep** → Work shown as **floating cards composed around the hero**, not a flat grid.
- **Ventriloc** → **floating frosted nav capsule** + floating preview cards.

The transformation hero *bridges both halves* of the taste: it opens in the
dark/cosmic register (GSAP/Dala/Air) and resolves into the warm editorial body
(Structured/Steep/Ventriloc).

---

## 2. File structure (mirrors the `Bluefin/` folder pattern)

```
index.html              Home (one-pager)
work.html               Work index
css/styles.css          single design system (tokens + components)
js/main.js              nav, scroll-reveals, i18n dictionary + swap, contact form, Lenis init
js/hero.js              pinned hero transformation (canvas image-sequence scrub) + ember particle ambient
js/work-preview.js      lazy autoplay / hover playback of flagship video loops
assets/hero/            frame-000…NNN.webp  +  hero-poster.webp
assets/work/            soopork.{mp4,webm}, zielo.{mp4,webm}, etuga.{mp4,webm}
images/                 existing screenshots, reused for static cards
```

- Shared nav + footer are **hand-duplicated** across the 2 pages (accepted cost of no-build).
- The i18n translation dictionary moves out of inline HTML into `js/main.js` (or `js/i18n.js`) and is shared by both pages.
- **CDN dependencies** (script/link tags, no bundler): GSAP + ScrollTrigger, Lenis, Google Fonts. This preserves the "no build step" rule and the existing `.github/workflows/static.yml` deploy (uploads files as-is).

---

## 3. Visual system (one committed look)

**Type — the hero of the design.**
- Display: **Instrument Serif** (already in the stack). Hero headline `clamp(60px, 13vw, 150px)`, line-height `0.86–0.92`, tracking `-0.025em` to `-0.03em`, allowed to **crop/bleed off the right edge**. Section titles 40–104px.
- Labels: **JetBrains Mono**, uppercase, `0.16–0.18em` tracking — eyebrows, `/ 01`–`/ 04` section numbers, the `{ … }` accent label.
- Body: **Inter Tight** / system stack.

**Color.**
- Warm body canvas: paper `#ECE8DF`, ink `#1A1714`, muted `#8A8275`, hairline `#D6CFC0`.
- Dark sections (hero start, Work band): `#16140F`, cream text `#ECE6D8`, dark-muted `#8C8472`.
- Accent: **ember `#C7451B`** — punctuation only (the emphasized headline word, one stat figure, links, the `/02` label). Never a filled background field.

**Surfaces & layout.**
- **Flat. No drop shadows.** Depth comes from contrast, 1px hairline borders, and the dark/light cut.
- Hard full-bleed light↔dark section cuts. Content max-width ~1180px, 40px gutters, 60–90px section gaps.
- **Floating frosted nav capsule** (pill, `backdrop-filter: blur`, hairline border).
- **Pill buttons** (full radius); ghost + filled (ink) variants.
- Cards: flat, 8px radius, 1px hairline border (cream on dark, putty on light).

**Pixel-art signature.** Retired everywhere except **one** small 8-bit square mark in the footer — the surviving wink of the old identity.

---

## 4. The hero — the WOW (concept + mechanics)

**Concept ("The transformation").** A fixed-camera shot of a small-business space
that transforms as the user scrolls: pre-dawn, dark, chairs up, cold → lights rise,
candles flare, steam and plated food appear, the room fills with golden warmth, and a
device on the counter lights up showing *its* website. It ends warm and lit — and that
warmth *is* the page body below.

**Composition (device-dominated).**
- Full-bleed Higgsfield transformation as the centerpiece image.
- Giant cropped serif headline ("…that **mean it.**") bleeding off the edge.
- **Ember particle ambient** canvas layer over the dark start state (Dala move).
- **Frosted-glass stat capsule** (Founded / Sites shipped / Turnaround) + capsule nav floating over it (Air/Ventriloc).
- **Floating Work cards** composed at the lower edge (Steep) — teaser into Selected Work.
- Mono scroll cue: `⇅ SCROLL TO TRANSFORM`.

**Mechanics.** The proven Bluefin Craft technique: one Higgsfield (Seedance) clip →
exported to ~120 WebP frames → scrubbed frame-by-frame on a **pinned `<canvas>`**
(`js/hero.js`, adapted from `Bluefin/js/craft.js`), driven by GSAP ScrollTrigger. The
ember particle field is a lightweight requestAnimationFrame canvas (port of the
`ocean.js` particle approach).

**Hero content depicted (assumption):** a *generic* warm restaurant/café (LuckyWeb's
core client type), so it reads as "any business that means it" — not a specific client.

---

## 5. Page sections

### Home — `index.html`
1. **Hero** — the transformation (section 4).
2. **Services / 01** — "What we do, end to end." Four services verbatim: Design, Development, E-commerce, Launch & care.
3. **Selected Work / 02** — dark band; floating featured cards with Higgsfield loops; "See all work ↗" → `work.html`.
4. **Process / 03** — "Quietly fast, honestly priced." Four steps: Brief → Design → Build → Launch + "Request a quote" CTA.
5. **Contact / 04** — "Let's talk about your project." Form, `info@luckyweb.org`, hours (Mon–Fri 09:00–18:00), languages.
6. **Footer** — nav, details, the single pixel mark.

### Work — `work.html`
- Intro: "A few of the sites we've built."
- **Featured (animated):** ~4 cards with Higgsfield loops — **Bluefin, SooPork, Zielo Bar, Etuga**.
- **More work (static):** remaining client pages as elegant static cards (existing `images/*.png` + others as available).
- **"Your site, next."** CTA → contact.
- Home ↔ Work navigation uses the **View Transitions API** (native, no lib) for a seamless cross-page transition; degrades to a normal load where unsupported.

---

## 6. Higgsfield assets to generate (~4 video generations)

1. **Hero transformation** — 1 Seedance clip (dim→alive single-take) → ~120 WebP frames + `hero-poster.webp` (the final lit frame).
2. **SooPork** — atmospheric brand loop (e.g. sizzling pork / steam).
3. **Zielo Bar** — atmospheric brand loop (e.g. pour / neon-on-glass).
4. **Etuga** — atmospheric brand loop (e.g. guesthouse warmth / landscape).

**Bluefin reuses its existing assets.** All media is owned, generated with Higgsfield,
and stored locally under `assets/` — no external hot-linking (same policy as Bluefin).
**Check the Higgsfield credit balance before generating.**

---

## 7. Motion system (GSAP + ScrollTrigger + Lenis, via CDN)

- **Lenis** smooth-momentum scroll (the biggest "feels expensive" lever).
- **Page-load reveal** → hero (optional curtain, reusing the Bluefin shoji-door idea).
- **Hero scroll-scrub** transformation (pinned canvas, ScrollTrigger).
- **Type mask-rise** reveals (clean translate, no blur gimmick), scroll-linked.
- **Ember particle ambient** in the hero dark state.
- **Floating-card parallax** + in-view loop playback for Work cards.
- **Count-up** stats.
- **View Transitions** for Home ↔ Work.

All motion is restrained and in service of the art direction.

---

## 8. Performance & accessibility

- Lazy-load frames/videos; poster-first; decode hero frames progressively; pause off-screen canvases.
- **`prefers-reduced-motion`** fully honored: static lit poster for the hero, particles render a single static frame, reveals appear instantly, Lenis disabled.
- **Mobile**: if scroll-scrub is too heavy, fall back to poster + a short looping video; reduce particle count by viewport.
- Keep the page light and fast — the studio's own pitch is "fast, lightweight, hand-coded," so the hub must embody it.

---

## 9. Retired from the current hub

Scroll-morph pixel artifact (SWORD→HELMET), the "UN-PIXELATE / LEVEL UP" mage gimmick,
knight pixel band, landscape canvas, the theme switcher (warm/cool/ink) + accent tweaks
panel, the display-font switcher (serif/sans/pixel), and `data-comment-anchor` review
cruft.

---

## 10. Success criteria

- [ ] Hero delivers the "wow" at the bar set by the reference set (device-dominated, cinematic, sculptural type).
- [ ] Loads fast on mobile + desktop despite video (lazy, poster-first).
- [ ] Fully responsive; `prefers-reduced-motion` path verified.
- [ ] All real content preserved: 4 services, 4 process steps, contact details, i18n.
- [ ] Consistent visual system across Home + Work; shared nav/footer in sync.
- [ ] Deploys on GitHub Pages with **no build step** (CDN libs only); `static.yml` unchanged.
- [ ] All Higgsfield media owned + stored locally; no hot-linking.

---

## 11. Open questions / assumptions

- **Hero subject** assumed generic warm restaurant/café (not a specific client). Confirm.
- **Featured four** assumed Bluefin, SooPork, Zielo Bar, Etuga. Confirm or swap.
- **Refero refs** treated as a quality bar + device map (section 1), not pixel-copied.
