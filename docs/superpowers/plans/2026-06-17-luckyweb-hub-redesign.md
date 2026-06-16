# LuckyWeb Hub Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the LuckyWeb studio hub as a 2-page, zero-build static site (`index.html` + `work.html`) with an editorial art-directed look and a device-dominated cinematic Higgsfield hero.

**Architecture:** Plain static files served as-is on GitHub Pages (the existing `.github/workflows/static.yml` is untouched). Runtime motion uses CDN globals (GSAP + ScrollTrigger + Lenis). New JS is authored as **native ES modules** under `js/` — loaded in the browser via `<script type="module">`, and unit-tested in Node with **Vitest** (dev-only; never deployed). Pure logic lives in `js/lib/*` (fully unit-tested); DOM/visual wiring lives in entry modules `js/main.js`, `js/hero.js`, `js/work-preview.js` (browser-verified). All Higgsfield media is generated up front (Phase 1), owned, and stored locally under `assets/`.

**Tech Stack:** HTML5, CSS (custom properties, no framework), ES modules, GSAP 3 + ScrollTrigger, Lenis (CDN); Vitest + jsdom (dev test runner); ffmpeg (asset pipeline); Higgsfield AI (media generation).

**Spec:** `docs/superpowers/specs/2026-06-17-luckyweb-hub-redesign-design.md`

---

## Testing strategy (read first)

- **Pure logic** (`js/lib/*`) → TDD with Vitest: write failing test → run → implement → run → commit.
- **DOM/visual** (entry modules, CSS, markup) → build → serve (`python3 -m http.server 8000`) → verify behavior in a browser (use the `run` / `verify` skills) → commit. Each such task lists explicit **acceptance criteria**.
- **Reduced motion** is a first-class acceptance criterion on every motion task: test with the OS "reduce motion" setting or DevTools → Rendering → "Emulate prefers-reduced-motion".
- Visual polish on markup/CSS tasks should be executed with the **frontend-design** skill, using the spec's §3 design system as the contract.

## File structure

```
package.json                 NEW  dev tooling (vitest, jsdom) — not deployed
vitest.config.js             NEW  jsdom env, tests/**/*.test.js
.gitignore                   MOD  add node_modules/
tests/                       NEW  *.test.js (Vitest)
js/lib/env.js                NEW  prefersReducedMotion()
js/lib/i18n.js               NEW  STRINGS, LANGS, translate(), applyTranslations()
js/lib/scrub.js              NEW  frameIndexForProgress()
js/lib/particles.js          NEW  particleCount(), stepParticle()
js/lib/preview.js            NEW  shouldPlay()
js/lib/transitions.js        NEW  supportsViewTransitions(), navigateWithTransition()
js/main.js                   NEW  nav, i18n apply+toggle, Lenis, reveals, contact form
js/hero.js                   NEW  particle ambient + scroll-scrub + headline + count-up
js/work-preview.js           NEW  in-view loop playback
css/styles.css               NEW  design system + components + sections
index.html                   REWRITE  Home one-pager
work.html                    NEW  Work index
assets/hero/                 NEW  frame-001..NNN.webp, hero-poster.webp, hero.mp4, hero.webm
assets/work/                 NEW  soopork|zielo|etuga .mp4/.webm/.jpg
images/                      KEEP existing screenshots (static cards)
```

The old monolithic `index.html` is fully replaced. Shared nav/footer markup is hand-duplicated in `index.html` and `work.html` (accepted no-build cost).

---

## Phase 1 — Tooling & scaffold

### Task 1: Dev test runner

**Files:**
- Create: `package.json`, `vitest.config.js`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "luckyweb",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.js'],
  },
});
```

- [ ] **Step 3: Ignore `node_modules`**

Append to `.gitignore`:
```
node_modules/
```

- [ ] **Step 4: Install (registry is slow on this box — allow a few minutes)**

Run: `npm install`
Expected: `node_modules/` created; `vitest` resolvable via `npx vitest --version`.

- [ ] **Step 5: Verify the runner starts**

Run: `npm test`
Expected: exits 0 with "No test files found" (no tests yet) — confirms Vitest runs.

- [ ] **Step 6: Commit**

```bash
git add package.json vitest.config.js .gitignore
git commit -m "Add Vitest dev test runner"
```

### Task 2: Environment helper (`prefersReducedMotion`)

**Files:**
- Create: `js/lib/env.js`
- Test: `tests/env.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/env.test.js
import { describe, it, expect } from 'vitest';
import { prefersReducedMotion } from '../js/lib/env.js';

const fakeWin = (matches) => ({ matchMedia: () => ({ matches }) });

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    expect(prefersReducedMotion(fakeWin(true))).toBe(true);
  });
  it('is false when it does not match', () => {
    expect(prefersReducedMotion(fakeWin(false))).toBe(false);
  });
  it('is false when matchMedia is unavailable', () => {
    expect(prefersReducedMotion({})).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/env.test.js`
Expected: FAIL — cannot import `prefersReducedMotion`.

- [ ] **Step 3: Implement**

```js
// js/lib/env.js
export function prefersReducedMotion(win = globalThis) {
  return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/env.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add js/lib/env.js tests/env.test.js
git commit -m "Add prefersReducedMotion helper"
```

### Task 3: Design-system stylesheet (tokens + primitives)

**Files:**
- Create: `css/styles.css`

This is the single source of visual truth (spec §3). No tests — verified visually once the first page renders (Task 5).

- [ ] **Step 1: Write `css/styles.css`**

```css
/* ===== Tokens (spec §3) ===== */
:root{
  --paper:#ECE8DF; --ink:#1A1714; --muted:#8A8275; --hair:#D6CFC0;
  --dark:#16140F; --cream:#ECE6D8; --dark-muted:#8C8472;
  --accent:#C7451B;
  --maxw:1180px; --gutter:40px;
  --font-display:'Instrument Serif',Georgia,serif;
  --font-body:'Inter Tight',system-ui,-apple-system,sans-serif;
  --font-mono:'JetBrains Mono',ui-monospace,monospace;
}
*{margin:0;padding:0;box-sizing:border-box}
html{-webkit-font-smoothing:antialiased}
body{background:var(--paper);color:var(--ink);font-family:var(--font-body);font-size:16px;line-height:1.5;overflow-x:hidden}
a{color:inherit;text-decoration:none}
img,canvas,video{display:block;max-width:100%}
.wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--gutter)}
.serif{font-family:var(--font-display);font-weight:400}
.mono{font-family:var(--font-mono);font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}

/* ===== Eyebrow / section head ===== */
.eyebrow{display:flex;align-items:center;gap:14px;margin-bottom:28px}
.eyebrow .bar{flex:1;height:1px;background:var(--hair)}
.section{padding:84px 0;border-top:1px solid var(--hair)}
.section-title{font-family:var(--font-display);font-weight:400;font-size:clamp(34px,5.5vw,72px);line-height:1.0;letter-spacing:-.02em}
.section-title em{font-style:italic;color:var(--accent)}
.section-lede{max-width:46ch;color:#3A352E;margin-top:16px;font-size:17px}

/* ===== Buttons (pills) ===== */
.btn{display:inline-flex;align-items:center;gap:8px;border:1px solid var(--ink);background:var(--ink);color:var(--paper);
     padding:13px 22px;border-radius:100px;font-size:14px;font-weight:500;transition:opacity .25s,transform .25s}
.btn:hover{transform:translateY(-1px)}
.btn.ghost{background:transparent;color:var(--ink)}

/* ===== Cards (flat, hairline) ===== */
.card{border:1px solid var(--hair);border-radius:8px;overflow:hidden;background:#FAF8F2}
.card-media{aspect-ratio:4/3;background:var(--hair);position:relative;overflow:hidden}
.card-meta{display:flex;justify-content:space-between;align-items:baseline;padding:16px}
.card-name{font-family:var(--font-display);font-size:24px}
.card-cat{font-family:var(--font-mono);font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}

/* ===== Reveal (JS adds .in) ===== */
.r{opacity:0;transform:translateY(26px);transition:opacity .8s ease,transform .9s cubic-bezier(.16,1,.3,1)}
.r.in{opacity:1;transform:none}

@media (prefers-reduced-motion:reduce){
  *{transition:none!important;animation:none!important}
  .r{opacity:1!important;transform:none!important}
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "Add design-system stylesheet (tokens + primitives)"
```

### Task 4: Shared nav capsule + footer (partial, in both pages later)

**Files:**
- Modify: `css/styles.css` (append)

- [ ] **Step 1: Append nav + footer styles to `css/styles.css`**

```css
/* ===== Floating nav capsule ===== */
.nav{position:fixed;top:18px;left:50%;transform:translateX(-50%);z-index:50;display:flex;align-items:center;gap:24px;
     background:rgba(236,232,223,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
     border:1px solid var(--hair);border-radius:100px;padding:9px 10px 9px 22px;max-width:calc(100vw - 32px)}
.nav .brand{font-family:var(--font-display);font-size:19px;letter-spacing:-.01em}
.nav a.lnk{font-size:13px;opacity:.7}
.nav a.lnk:hover{opacity:1}
.nav .cta{background:var(--ink);color:var(--paper);font-size:13px;padding:9px 16px;border-radius:100px}
.lang{display:flex;gap:6px;margin-left:6px}
.lang button{font-family:var(--font-mono);font-size:10px;letter-spacing:.08em;background:none;border:0;color:var(--muted);cursor:pointer;padding:4px}
.lang button.active{color:var(--ink)}

/* ===== Footer ===== */
.footer{border-top:1px solid var(--hair);padding:54px 0;display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}
.footer .px{display:inline-block;width:16px;height:16px;background:repeating-conic-gradient(var(--ink) 0 25%,var(--accent) 0 50%) 0 0/6px 6px;image-rendering:pixelated;vertical-align:middle;margin-left:8px}

@media (max-width:680px){
  .nav{gap:12px;padding-left:16px}
  .nav a.lnk{display:none}
}
```

- [ ] **Step 2: Commit**

```bash
git add css/styles.css
git commit -m "Add nav capsule + footer styles"
```

---

## Phase 2 — Higgsfield assets (generated up front)

> Generation is interactive and credit-gated. Use the **higgsfield-generate** skill for each generation; it handles job submission, polling, and retrieval. Videos are Seedance 2.0. Download each result locally, then process with ffmpeg. **Do not hot-link** — all media lives under `assets/`.

### Task 5: Check credits & generate the hero transformation clip

**Files:**
- Create: `assets/hero/hero.mp4`, `assets/hero/hero.webm`, `assets/hero/hero-poster.webp`, `assets/hero/frame-001.webp …`

- [ ] **Step 1: Check balance**

Invoke the higgsfield-generate skill / the Higgsfield `balance` (or `show_plans_and_credits`) tool. Confirm enough credits for 4 video generations before proceeding. If low, stop and report to the user.

- [ ] **Step 2: Generate the hero clip (Seedance 2.0, 16:9, ~5s, seamless-ish)**

Prompt:
> "Single fixed locked-off camera, interior of a small warm restaurant/café. The shot transforms over 5 seconds from pre-dawn and dark — chairs up on tables, cold blue light, empty — to fully alive: warm pendant and candle light rises, steam curls from a fresh dish on the counter, golden hour glow fills the room, and a laptop on the counter lights up showing a website. Cinematic, photoreal, shallow depth of field, slow graceful transition. No people walking, no camera movement."

Retrieve the result and note its URL/job id.

- [ ] **Step 3: Download the clip**

Run (replace URL with the retrieved one):
```bash
mkdir -p assets/hero
curl -L -o assets/hero/hero.mp4 "<HERO_VIDEO_URL>"
ffprobe -v error -show_entries format=duration -of csv=p=0 assets/hero/hero.mp4
```
Expected: a duration (~5s) prints; `hero.mp4` exists and is non-trivial in size.

- [ ] **Step 4: Extract the scroll-scrub frames + poster + webm fallback**

Run:
```bash
ffmpeg -y -i assets/hero/hero.mp4 -vf "fps=24,scale=1600:-2:flags=lanczos" assets/hero/frame-%03d.webp
ls assets/hero/frame-*.webp | wc -l            # expect ~110–130 frames
cp "$(ls assets/hero/frame-*.webp | tail -1)" assets/hero/hero-poster.webp   # final lit frame = poster
ffmpeg -y -i assets/hero/hero.mp4 -c:v libvpx-vp9 -b:v 0 -crf 34 -an assets/hero/hero.webm
```
Expected: ~110–130 `frame-NNN.webp` files, a `hero-poster.webp`, and `hero.webm`.

- [ ] **Step 5: Record the frame count**

Note the exact count (e.g. 120) — `js/hero.js` reads it from a data attribute set in `index.html` (Task 12), so no code constant is needed.

- [ ] **Step 6: Commit**

```bash
git add assets/hero
git commit -m "Add Higgsfield hero transformation assets"
```

### Task 6: Generate the three flagship Work loops

**Files:**
- Create: `assets/work/soopork.{mp4,webm,jpg}`, `assets/work/zielo.{mp4,webm,jpg}`, `assets/work/etuga.{mp4,webm,jpg}`

- [ ] **Step 1: Generate three Seedance 2.0 loops (16:9, ~4s each)**

Prompts:
- **soopork** — "Close-up, cinematic: Korean grilled pork belly sizzling on a hot cast-iron grill, fat rendering, steam and smoke rising in warm light, shallow depth of field, slow motion, photoreal. Loopable."
- **zielo** — "Close-up, cinematic: an amber cocktail being poured over ice in a dim bar, neon reflections on wet glass, condensation, moody warm-to-cool light, slow motion, photoreal. Loopable."
- **etuga** — "Cinematic slow pan-free shot: cozy guesthouse interior at golden hour, warm lamplight, soft linens, a window onto a quiet Mongolian landscape, gentle dust motes in light, photoreal. Loopable."

- [ ] **Step 2: Download + transcode each (mp4 h264 + webm vp9 + poster jpg)**

Run for each name in `soopork zielo etuga` (replace URLs):
```bash
mkdir -p assets/work
for n in soopork zielo etuga; do
  curl -L -o "assets/work/$n.src.mp4" "<URL_FOR_$n>"
  ffmpeg -y -i "assets/work/$n.src.mp4" -c:v libx264 -crf 24 -pix_fmt yuv420p -movflags +faststart -an "assets/work/$n.mp4"
  ffmpeg -y -i "assets/work/$n.src.mp4" -c:v libvpx-vp9 -b:v 0 -crf 36 -an "assets/work/$n.webm"
  ffmpeg -y -i "assets/work/$n.mp4" -frames:v 1 "assets/work/$n.jpg"
  rm "assets/work/$n.src.mp4"
done
ls -la assets/work
```
Expected: `soopork|zielo|etuga` each with `.mp4`, `.webm`, `.jpg`.

- [ ] **Step 3: Commit**

```bash
git add assets/work
git commit -m "Add Higgsfield flagship Work loops"
```

---

## Phase 3 — Pure logic libraries (TDD)

### Task 7: i18n library (migrate the existing dictionary)

**Files:**
- Create: `js/lib/i18n.js`
- Test: `tests/i18n.test.js`
- Source to migrate: `index.html:2540-2715` (the `en/zh/mn/hy` translation object) and `setLang` at `index.html:2716`.

- [ ] **Step 1: Write the failing test**

```js
// tests/i18n.test.js
import { describe, it, expect } from 'vitest';
import { translate, applyTranslations, STRINGS, LANGS } from '../js/lib/i18n.js';

describe('translate', () => {
  it('returns the value for the given lang + key', () => {
    expect(translate(STRINGS, 'en', 'hero_sub')).toContain('design and build');
  });
  it('falls back to English for an unknown lang', () => {
    expect(translate(STRINGS, 'xx', 'hero_sub')).toBe(STRINGS.en.hero_sub);
  });
  it('returns empty string for an unknown key', () => {
    expect(translate(STRINGS, 'en', 'nope__')).toBe('');
  });
  it('exposes the four supported languages', () => {
    expect(LANGS).toEqual(['en', 'zh', 'mn', 'hy']);
  });
});

describe('applyTranslations', () => {
  it('sets textContent for plain keys and innerHTML for _html keys', () => {
    document.body.innerHTML =
      '<h1 data-t="hero_h1_html"></h1><p data-t="hero_sub"></p>';
    applyTranslations(document, STRINGS, 'en');
    expect(document.querySelector('h1').innerHTML).toContain('<em>');
    expect(document.querySelector('p').textContent).toContain('design and build');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/i18n.test.js`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `js/lib/i18n.js`**

Copy the FULL `en/zh/mn/hy` object verbatim from `index.html:2540-2715` into `STRINGS`. Skeleton (fill every key from the source — keys like `hero_h1_html`, `hero_sub`, `lbl_services`, `svc1_title`, `svc1_desc` … through contact):

```js
// js/lib/i18n.js
export const LANGS = ['en', 'zh', 'mn', 'hy'];

export const STRINGS = {
  en: {
    hero_h1_html: 'Websites for businesses that <em>mean it.</em>',
    hero_sub: "We design and build calm, considered websites for restaurants, shops, and small studios — usually in a week, sometimes faster.",
    lbl_services: 'Services / 01',
    svc1_title: 'Design', svc1_desc: 'Brand-first visual design, custom layouts, and considered typography. Drawn from scratch for your business.',
    /* …copy every remaining en key from index.html:2546-2588 verbatim… */
  },
  zh: { hero_h1_html: '为<em>认真做事</em>的企业打造网站。', /* …from index.html:2589+… */ },
  mn: { /* …verbatim… */ },
  hy: { /* …verbatim… */ },
};

export function translate(strings, lang, key) {
  const table = strings[lang] || strings.en;
  if (table && Object.prototype.hasOwnProperty.call(table, key)) return table[key];
  if (strings.en && Object.prototype.hasOwnProperty.call(strings.en, key)) return strings.en[key];
  return '';
}

export function applyTranslations(root, strings, lang) {
  const nodes = root.querySelectorAll('[data-t]');
  nodes.forEach((el) => {
    const key = el.getAttribute('data-t');
    const val = translate(strings, lang, key);
    if (key.endsWith('_html')) el.innerHTML = val;
    else el.textContent = val;
  });
  return nodes.length;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/i18n.test.js`
Expected: PASS. (If a `_html` assertion fails, confirm the `en.hero_h1_html` value contains `<em>`.)

- [ ] **Step 5: Commit**

```bash
git add js/lib/i18n.js tests/i18n.test.js
git commit -m "Add i18n library (migrated 4-language dictionary)"
```

### Task 8: Scrub frame-index math (TDD)

**Files:**
- Create: `js/lib/scrub.js`
- Test: `tests/scrub.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/scrub.test.js
import { describe, it, expect } from 'vitest';
import { frameIndexForProgress } from '../js/lib/scrub.js';

describe('frameIndexForProgress', () => {
  it('maps 0 → first frame', () => expect(frameIndexForProgress(0, 120)).toBe(0));
  it('maps 1 → last frame', () => expect(frameIndexForProgress(1, 120)).toBe(119));
  it('maps the midpoint to the middle', () => expect(frameIndexForProgress(0.5, 120)).toBe(60));
  it('clamps below 0', () => expect(frameIndexForProgress(-3, 120)).toBe(0));
  it('clamps above 1', () => expect(frameIndexForProgress(9, 120)).toBe(119));
  it('handles an empty sequence', () => expect(frameIndexForProgress(0.5, 0)).toBe(0));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/scrub.test.js` → FAIL (module not found).

- [ ] **Step 3: Implement `js/lib/scrub.js`**

```js
// js/lib/scrub.js
export function frameIndexForProgress(progress, frameCount) {
  if (frameCount <= 0) return 0;
  const p = Math.min(1, Math.max(0, progress));
  return Math.min(frameCount - 1, Math.floor(p * frameCount));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/scrub.test.js` → PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add js/lib/scrub.js tests/scrub.test.js
git commit -m "Add scroll-scrub frame-index math"
```

### Task 9: Particle field math (TDD)

**Files:**
- Create: `js/lib/particles.js`
- Test: `tests/particles.test.js`

- [ ] **Step 1: Write the failing test**

```js
// tests/particles.test.js
import { describe, it, expect } from 'vitest';
import { particleCount, stepParticle } from '../js/lib/particles.js';

describe('particleCount', () => {
  it('scales with area / density', () => expect(particleCount(1000, 550, 5500)).toBe(100));
  it('is 0 for zero-size canvases', () => expect(particleCount(0, 600)).toBe(0));
});

describe('stepParticle', () => {
  it('advances by velocity', () => {
    expect(stepParticle({ x: 10, y: 10, vx: 2, vy: -3 }, 100, 100)).toMatchObject({ x: 12, y: 7 });
  });
  it('wraps past the right/bottom edges', () => {
    const p = stepParticle({ x: 99, y: 99, vx: 5, vy: 5 }, 100, 100);
    expect(p.x).toBe(0); expect(p.y).toBe(0);
  });
  it('wraps past the left/top edges', () => {
    const p = stepParticle({ x: 1, y: 1, vx: -5, vy: -5 }, 100, 100);
    expect(p.x).toBe(100); expect(p.y).toBe(100);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/particles.test.js` → FAIL.

- [ ] **Step 3: Implement `js/lib/particles.js`**

```js
// js/lib/particles.js
export function particleCount(width, height, density = 5500) {
  if (width <= 0 || height <= 0) return 0;
  return Math.max(0, Math.round((width * height) / density));
}

export function stepParticle(p, width, height) {
  let x = p.x + p.vx;
  let y = p.y + p.vy;
  if (x < 0) x = width; else if (x > width) x = 0;
  if (y < 0) y = height; else if (y > height) y = 0;
  return { ...p, x, y };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/particles.test.js` → PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add js/lib/particles.js tests/particles.test.js
git commit -m "Add particle field math"
```

### Task 10: Preview + transitions helpers (TDD)

**Files:**
- Create: `js/lib/preview.js`, `js/lib/transitions.js`
- Test: `tests/preview.test.js`, `tests/transitions.test.js`

- [ ] **Step 1: Write failing tests**

```js
// tests/preview.test.js
import { describe, it, expect } from 'vitest';
import { shouldPlay } from '../js/lib/preview.js';

describe('shouldPlay', () => {
  it('plays at/above threshold', () => expect(shouldPlay(0.6, 0.5)).toBe(true));
  it('pauses below threshold', () => expect(shouldPlay(0.3, 0.5)).toBe(false));
});
```

```js
// tests/transitions.test.js
import { describe, it, expect, vi } from 'vitest';
import { supportsViewTransitions, navigateWithTransition } from '../js/lib/transitions.js';

describe('view transitions', () => {
  it('detects support', () => {
    expect(supportsViewTransitions({ startViewTransition: () => {} })).toBe(true);
    expect(supportsViewTransitions({})).toBe(false);
  });
  it('falls back to a plain navigation when unsupported', () => {
    const loc = { href: '' };
    navigateWithTransition('/work.html', { doc: {}, loc });
    expect(loc.href).toBe('/work.html');
  });
  it('wraps navigation in startViewTransition when supported', () => {
    const cb = vi.fn((fn) => fn());
    const loc = { href: '' };
    navigateWithTransition('/work.html', { doc: { startViewTransition: cb }, loc });
    expect(cb).toHaveBeenCalled();
    expect(loc.href).toBe('/work.html');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/preview.test.js tests/transitions.test.js` → FAIL.

- [ ] **Step 3: Implement**

```js
// js/lib/preview.js
export function shouldPlay(intersectionRatio, threshold = 0.5) {
  return intersectionRatio >= threshold;
}
```

```js
// js/lib/transitions.js
export function supportsViewTransitions(doc = document) {
  return typeof doc.startViewTransition === 'function';
}

export function navigateWithTransition(url, { doc = document, loc = location } = {}) {
  if (supportsViewTransitions(doc)) doc.startViewTransition(() => { loc.href = url; });
  else loc.href = url;
}
```

- [ ] **Step 4: Run to verify they pass**

Run: `npx vitest run` → ALL pass (env, i18n, scrub, particles, preview, transitions).

- [ ] **Step 5: Commit**

```bash
git add js/lib/preview.js js/lib/transitions.js tests/preview.test.js tests/transitions.test.js
git commit -m "Add preview + view-transition helpers"
```

---

## Phase 4 — Home page markup & content sections

### Task 11: Home skeleton, head, nav, footer, CDN libs

**Files:**
- Rewrite: `index.html`

- [ ] **Step 1: Write the Home skeleton** (sections filled in Tasks 12–15; keep their `<section>` stubs present so the page is valid)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>LuckyWeb — Websites for businesses that mean it</title>
  <link rel="icon" type="image/x-icon" href="favicon.ico">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Inter+Tight:wght@400;450;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <nav class="nav">
    <a class="brand" href="index.html">LuckyWeb</a>
    <a class="lnk" href="#work" data-t="nav_work">Work</a>
    <a class="lnk" href="#process" data-t="nav_process">Process</a>
    <a class="cta" href="#contact" data-t="hero_cta1">Start a project</a>
    <div class="lang">
      <button class="lang-btn active" data-lang="en">EN</button>
      <button class="lang-btn" data-lang="zh">ZH</button>
      <button class="lang-btn" data-lang="mn">MN</button>
      <button class="lang-btn" data-lang="hy">HY</button>
    </div>
  </nav>

  <main>
    <header class="hero" id="hero"><!-- Task 12 --></header>
    <section id="services" class="section"><!-- Task 13 --></section>
    <section id="work" class="section work-band"><!-- Task 14 --></section>
    <section id="process" class="section"><!-- Task 13 --></section>
    <section id="contact" class="section"><!-- Task 13 --></section>
  </main>

  <footer class="footer wrap">
    <span class="mono" data-t="footer_copy">© LuckyWeb 2026 — built, not templated</span><span class="px"></span>
    <span class="mono">info@luckyweb.org</span>
  </footer>

  <!-- CDN motion libs (no build) -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/lenis@1.1.18/dist/lenis.min.js"></script>
  <script type="module" src="js/main.js"></script>
  <script type="module" src="js/hero.js"></script>
  <script type="module" src="js/work-preview.js"></script>
</body>
</html>
```

- [ ] **Step 2: Serve & verify**

Run: `python3 -m http.server 8000`
Open `http://localhost:8000/` (use the `run` skill). **Acceptance:** page loads with no console errors except the empty module files (created next); the nav capsule floats, fonts load, footer shows the pixel mark. (`js/*` 404s are expected until Phase 5.)

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add Home skeleton (head, nav, footer, CDN libs)"
```

### Task 12: Hero markup

**Files:**
- Modify: `index.html` (`<header class="hero" id="hero">`)
- Modify: `css/styles.css` (append hero styles)

- [ ] **Step 1: Fill the hero markup** — set `data-frames` to the exact count from Task 5 Step 5.

```html
<header class="hero" id="hero" data-frames="120">
  <canvas class="hero-particles" aria-hidden="true"></canvas>
  <canvas class="hero-scrub" aria-hidden="true"></canvas>
  <img class="hero-poster" src="assets/hero/hero-poster.webp" alt="" aria-hidden="true">
  <video class="hero-video" playsinline muted loop preload="none" poster="assets/hero/hero-poster.webp" aria-hidden="true">
    <source src="assets/hero/hero.webm" type="video/webm">
    <source src="assets/hero/hero.mp4" type="video/mp4">
  </video>
  <div class="hero-inner wrap">
    <div class="eyebrow"><span class="mono" data-t="hero_eyebrow">Independent studio</span><span class="bar"></span><span class="mono">Est. 2026</span></div>
    <h1 class="hero-h1" data-t="hero_h1_html">Websites for businesses that <em>mean it.</em></h1>
    <div class="hero-mid">
      <p class="hero-sub r" data-t="hero_sub"></p>
      <div class="hero-acts r">
        <a class="btn" href="#contact"><span data-t="hero_cta1">Start a project</span> →</a>
        <a class="btn ghost" href="#work" data-t="hero_cta2">See our work</a>
      </div>
    </div>
    <div class="hero-stats">
      <div class="stat r"><div class="stat-n" data-count="40" data-suffix="+">0</div><div class="mono" data-t="meta2_l">Sites shipped</div></div>
      <div class="stat r"><div class="stat-n" data-count="6" data-suffix=" days">0</div><div class="mono" data-t="meta3_l">Avg. turnaround</div></div>
      <div class="stat r"><div class="stat-n serif">2026</div><div class="mono" data-t="meta1_l">Founded</div></div>
    </div>
  </div>
  <div class="hero-cue mono" data-t="hero_cue">⇅ Scroll to transform</div>
</header>
```

- [ ] **Step 2: Append hero styles to `css/styles.css`**

```css
.hero{position:relative;min-height:100svh;display:flex;align-items:flex-end;background:var(--dark);color:var(--cream);overflow:hidden}
.hero-particles,.hero-scrub,.hero-poster,.hero-video{position:absolute;inset:0;width:100%;height:100%}
.hero-scrub,.hero-poster,.hero-video{object-fit:cover}
.hero-particles{z-index:1}
.hero-scrub{z-index:0}
.hero-poster{z-index:0;object-fit:cover}
.hero-video{z-index:0;object-fit:cover;display:none}
.hero::after{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(180deg,rgba(22,20,15,.2),rgba(22,20,15,.55))}
.hero-inner{position:relative;z-index:3;width:100%;padding-bottom:7vh;padding-top:140px}
.hero-h1{font-family:var(--font-display);font-weight:400;font-size:clamp(58px,12.5vw,168px);line-height:.9;letter-spacing:-.028em;margin:18px 0 0;max-width:14ch}
.hero-h1 em{font-style:italic;color:var(--accent)}
.hero-mid{display:flex;justify-content:space-between;align-items:flex-end;gap:36px;margin-top:34px;border-top:1px solid rgba(236,230,216,.18);padding-top:22px}
.hero-sub{max-width:42ch;font-size:17px;color:#cfc8ba}
.hero-acts{display:flex;gap:12px;flex-shrink:0}
.hero .btn{border-color:var(--cream);background:var(--cream);color:var(--dark)}
.hero .btn.ghost{background:transparent;color:var(--cream)}
.hero-stats{display:flex;gap:0;margin-top:34px;border:1px solid rgba(236,230,216,.18);border-radius:12px;overflow:hidden;width:max-content;max-width:100%;backdrop-filter:blur(10px);background:rgba(20,18,13,.3)}
.hero-stats .stat{padding:16px 26px}
.hero-stats .stat + .stat{border-left:1px solid rgba(236,230,216,.18)}
.stat-n{font-family:var(--font-display);font-size:clamp(36px,5vw,64px);line-height:.9}
.hero-cue{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:3;color:#cfc8ba}
@media (max-width:680px){.hero-mid,.hero-stats{flex-direction:column;align-items:flex-start}.hero-stats .stat + .stat{border-left:0;border-top:1px solid rgba(236,230,216,.18)}}
```

- [ ] **Step 3: Verify** — reload `http://localhost:8000/`. **Acceptance:** the hero fills the viewport, poster image shows behind giant cropped headline + frosted stat capsule + scroll cue; layout is correct on mobile width. (Scrub/particles wired in Phase 5.) Polish spacing/scale with **frontend-design** against spec §3/§4.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "Add hero markup + styles"
```

### Task 13: Services, Process, Contact sections

**Files:**
- Modify: `index.html` (the `#services`, `#process`, `#contact` sections)
- Modify: `css/styles.css` (append)
- Modify: `js/main.js` (contact form handler — created in Task 16; add the handler there)

- [ ] **Step 1: Fill `#services`** (content verbatim from current site)

```html
<div class="wrap">
  <div class="eyebrow"><span class="mono" data-t="lbl_services">Services / 01</span><span class="bar"></span></div>
  <h2 class="section-title r" data-t="services_title_html">What we <em>do</em>, end to end.</h2>
  <p class="section-lede r" data-t="services_lede"></p>
  <div class="svc-grid">
    <div class="svc r"><span class="svc-num">01</span><h3 class="svc-title" data-t="svc1_title">Design</h3><p class="svc-desc" data-t="svc1_desc"></p></div>
    <div class="svc r"><span class="svc-num">02</span><h3 class="svc-title" data-t="svc2_title">Development</h3><p class="svc-desc" data-t="svc2_desc"></p></div>
    <div class="svc r"><span class="svc-num">03</span><h3 class="svc-title" data-t="svc3_title">E-commerce</h3><p class="svc-desc" data-t="svc3_desc"></p></div>
    <div class="svc r"><span class="svc-num">04</span><h3 class="svc-title" data-t="svc4_title">Launch &amp; care</h3><p class="svc-desc" data-t="svc4_desc"></p></div>
  </div>
</div>
```

- [ ] **Step 2: Fill `#process`**

```html
<div class="wrap">
  <div class="eyebrow"><span class="mono" data-t="lbl_process">How it works / 03</span><span class="bar"></span></div>
  <h2 class="section-title r" data-t="process_title_html">Quietly fast, <em>honestly priced.</em></h2>
  <p class="section-lede r" data-t="process_lede"></p>
  <div class="proc-grid">
    <div class="proc r"><div class="mono">Step 01</div><h3 data-t="ps1_t">Brief</h3><p data-t="ps1_d"></p></div>
    <div class="proc r"><div class="mono">Step 02</div><h3 data-t="ps2_t">Design</h3><p data-t="ps2_d"></p></div>
    <div class="proc r"><div class="mono">Step 03</div><h3 data-t="ps3_t">Build</h3><p data-t="ps3_d"></p></div>
    <div class="proc r"><div class="mono">Step 04</div><h3 data-t="ps4_t">Launch</h3><p data-t="ps4_d"></p></div>
  </div>
  <div class="proc-quote r">
    <p class="quote-text serif" data-t="quote_html"></p>
    <a class="btn" href="#contact"><span data-t="process_cta">Request a quote</span> →</a>
  </div>
</div>
```

- [ ] **Step 3: Fill `#contact`**

```html
<div class="wrap contact-grid">
  <div class="contact-side">
    <div class="eyebrow"><span class="mono" data-t="lbl_contact">Contact / 04</span><span class="bar"></span></div>
    <h2 class="section-title r" data-t="contact_title_html">Let's talk about <em>your project.</em></h2>
    <p class="r" data-t="contact_lede"></p>
    <div class="contact-detail mono">
      <div class="row"><span data-t="c_email">Email</span><a href="mailto:info@luckyweb.org">info@luckyweb.org</a></div>
      <div class="row"><span data-t="c_hours">Hours</span><span data-t="c_hours_v">Mon–Fri, 09:00–18:00</span></div>
    </div>
  </div>
  <form class="contact-form" id="contact-form" novalidate>
    <label><span data-t="f_name">Name</span><input name="name" required></label>
    <label><span data-t="f_email">Email</span><input name="email" type="email" required></label>
    <label><span data-t="f_msg">Project</span><textarea name="message" rows="4" required></textarea></label>
    <button class="btn" type="submit"><span data-t="f_send">Send</span> →</button>
    <p class="form-note mono" id="form-note" role="status"></p>
  </form>
</div>
```

- [ ] **Step 4: Append section CSS to `css/styles.css`**

```css
.svc-grid,.proc-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--hair);border:1px solid var(--hair);margin-top:40px}
.svc,.proc{background:var(--paper);padding:26px 22px;min-height:200px;display:flex;flex-direction:column;gap:10px}
.svc-num{font-family:var(--font-mono);font-size:11px;color:var(--accent)}
.svc-title,.proc h3{font-family:var(--font-display);font-size:26px}
.svc-desc,.proc p{color:#3A352E;font-size:15px}
.proc-quote{margin-top:40px;display:flex;justify-content:space-between;align-items:center;gap:24px;flex-wrap:wrap;border-top:1px solid var(--hair);padding-top:28px}
.quote-text{font-size:clamp(22px,3vw,34px);max-width:24ch}.quote-text em{color:var(--accent);font-style:italic}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}
.contact-detail{margin-top:24px;display:flex;flex-direction:column;gap:8px}
.contact-detail .row{display:flex;gap:14px}
.contact-form{display:flex;flex-direction:column;gap:14px}
.contact-form label{display:flex;flex-direction:column;gap:6px}
.contact-form .mono,.contact-form label span{font-family:var(--font-mono);font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}
.contact-form input,.contact-form textarea{font-family:var(--font-body);font-size:16px;padding:12px 14px;border:1px solid var(--hair);border-radius:8px;background:#FAF8F2}
@media (max-width:760px){.svc-grid,.proc-grid{grid-template-columns:1fr 1fr}.contact-grid{grid-template-columns:1fr}}
```

- [ ] **Step 5: Verify** — reload. **Acceptance:** all three sections render with the correct content once i18n runs (Task 16); grids are hairline-separated, flat, responsive. Polish with **frontend-design** per spec §3. (Text is empty until i18n applies — that's expected pre-Task 16; the `data-t` defaults already show for Services titles.)

- [ ] **Step 6: Commit**

```bash
git add index.html css/styles.css
git commit -m "Add Services, Process, Contact sections"
```

---

## Phase 5 — Behavior & motion (browser-verified)

### Task 14: `main.js` — i18n apply, language toggle, reveals, Lenis, form

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: Write `js/main.js`**

```js
// js/main.js
import { STRINGS, LANGS, applyTranslations } from './lib/i18n.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);

function setLang(lang) {
  if (!LANGS.includes(lang)) lang = 'en';
  applyTranslations(document, STRINGS, lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  try { localStorage.setItem('lw-lang', lang); } catch {}
}
window.setLang = setLang;

function initReveals() {
  const els = document.querySelectorAll('.r');
  if (reduce) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18 });
  els.forEach((el) => io.observe(el));
}

function initSmoothScroll() {
  if (reduce || !window.Lenis) return;
  const lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
}

function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const note = document.getElementById('form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = 'Please fill every field.'; return; }
    const data = new FormData(form);
    const body = encodeURIComponent(`From: ${data.get('name')} <${data.get('email')}>\n\n${data.get('message')}`);
    window.location.href = `mailto:info@luckyweb.org?subject=New%20project%20enquiry&body=${body}`;
    note.textContent = 'Opening your email client…';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let saved = 'en';
  try { saved = localStorage.getItem('lw-lang') || 'en'; } catch {}
  setLang(saved);
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => setLang(b.getAttribute('data-lang'))));
  initReveals();
  initSmoothScroll();
  initForm();
});
```

- [ ] **Step 2: Verify** — reload `http://localhost:8000/`. **Acceptance:** all text populates; clicking EN/ZH/MN/HY swaps every `data-t` node and persists on reload; sections fade/rise in on scroll; scrolling feels smooth (Lenis). With "reduce motion" emulated: text still populates, reveals are instant, no smooth-scroll. Contact submit opens a prefilled mailto.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "Add main.js (i18n, language toggle, reveals, Lenis, form)"
```

### Task 15: `hero.js` — particle ambient, scroll-scrub, headline, count-up

**Files:**
- Create: `js/hero.js`

- [ ] **Step 1: Write `js/hero.js`**

```js
// js/hero.js
import { frameIndexForProgress } from './lib/scrub.js';
import { particleCount, stepParticle } from './lib/particles.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);
const hero = document.getElementById('hero');
if (hero) initHero(hero);

function initHero(hero) {
  initParticles(hero.querySelector('.hero-particles'));
  initHeadline(hero);
  initCountUp(hero);

  const isMobile = window.matchMedia('(max-width:760px)').matches;
  const scrub = hero.querySelector('.hero-scrub');
  const poster = hero.querySelector('.hero-poster');
  const video = hero.querySelector('.hero-video');

  if (reduce) { scrub.style.display = 'none'; poster.style.display = 'block'; return; }
  if (isMobile || !window.gsap || !window.ScrollTrigger) {
    // Fallback: poster + looping video, no pinned scrub
    scrub.style.display = 'none'; poster.style.display = 'none';
    video.style.display = 'block'; video.play().catch(() => { video.style.display = 'none'; poster.style.display = 'block'; });
    return;
  }
  initScrub(hero, scrub, poster);
}

function initParticles(canvas) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, pts;
  const size = () => {
    w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight;
    const n = particleCount(w, h, reduce ? 1e9 : 5500);
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.6 + 0.4,
      vx: (Math.random() - 0.5) * 0.12, vy: (Math.random() - 0.5) * 0.12, a: Math.random() * 0.5 + 0.2,
    }));
  };
  size(); addEventListener('resize', size);
  if (reduce) { draw(); return; }      // single static frame
  (function loop() { draw(); requestAnimationFrame(loop); })();
  function draw() {
    ctx.clearRect(0, 0, w, h);
    pts = pts.map((p) => stepParticle(p, w, h));
    for (const p of pts) { ctx.globalAlpha = p.a; ctx.fillStyle = '#C7451B'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  }
}

function initHeadline(hero) {
  const h1 = hero.querySelector('.hero-h1');
  if (!h1 || reduce || !window.gsap) return;
  // wrap each line-word group already present; animate the whole h1 up once
  window.gsap.from(h1, { yPercent: 12, opacity: 0, duration: 1.0, ease: 'power3.out', delay: 0.1 });
}

function initCountUp(hero) {
  hero.querySelectorAll('[data-count]').forEach((el) => {
    const to = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = to + suf; return; }
    let t0;
    const step = (t) => { t0 = t0 || t; const p = Math.min((t - t0) / 1100, 1); const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e) + suf; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
}

function initScrub(hero, canvas, poster) {
  const count = parseInt(hero.dataset.frames, 10) || 120;
  const ctx = canvas.getContext('2d');
  const frames = [];
  let loaded = 0;
  const pad = (i) => String(i).padStart(3, '0');
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.src = `assets/hero/frame-${pad(i)}.webp`;
    img.onload = () => { loaded++; if (loaded === 1) drawFrame(0); };
    frames.push(img);
  }
  const fit = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; };
  fit(); addEventListener('resize', fit);
  poster.style.display = 'none';

  function drawFrame(idx) {
    const img = frames[idx]; if (!img || !img.complete || !img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  window.gsap.registerPlugin(window.ScrollTrigger);
  window.ScrollTrigger.create({
    trigger: hero, start: 'top top', end: '+=180%', pin: true, scrub: 0.4,
    onUpdate: (self) => drawFrame(frameIndexForProgress(self.progress, count)),
  });
}
```

- [ ] **Step 2: Verify** — reload. **Acceptance (desktop):** an ember particle field drifts over the dark hero; scrolling **pins** the hero and scrubs the transformation frames from dark→lit; headline rises in; stats count up. **Mobile width:** poster + looping video instead of pinned scrub. **Reduce motion:** static poster, single particle frame, instant stats, no pin. No console errors.

- [ ] **Step 3: Commit**

```bash
git add js/hero.js
git commit -m "Add hero particle ambient + scroll-scrub transformation"
```

---

## Phase 6 — Work (Home band + work.html)

### Task 16: Selected Work band on Home + `work-preview.js`

**Files:**
- Modify: `index.html` (`#work` section)
- Modify: `css/styles.css` (append)
- Create: `js/work-preview.js`

- [ ] **Step 1: Fill `#work` (dark band, floating featured cards)**

```html
<div class="wrap">
  <div class="eyebrow"><span class="mono" style="color:var(--accent)" data-t="lbl_work">/ Selected work · 02</span><span class="bar"></span></div>
  <h2 class="section-title r" data-t="work_title_html">A few of the sites <em>we've built.</em></h2>
  <p class="section-lede r" data-t="work_lede"></p>
  <div class="work-feature">
    <a class="card wcard r" href="Bluefin/"><div class="card-media" data-loop="assets/work/bluefin"><img src="images/bluefin.png" alt="Bluefin website"></div><div class="card-meta"><span class="card-name">Bluefin</span><span class="card-cat">Restaurant</span></div></a>
    <a class="card wcard r" href="soopork.html"><div class="card-media" data-loop="assets/work/soopork"><img src="images/soopork.png" alt="SooPork website"></div><div class="card-meta"><span class="card-name">SooPork</span><span class="card-cat">Restaurant</span></div></a>
    <a class="card wcard r" href="zielobar.html"><div class="card-media" data-loop="assets/work/zielo"><img src="images/zielo.png" alt="Zielo Bar website"></div><div class="card-meta"><span class="card-name">Zielo Bar</span><span class="card-cat">Bar</span></div></a>
    <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga Guesthouse website"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
  </div>
  <a class="btn ghost work-all" href="work.html"><span data-t="work_all">See all work</span> ↗</a>
</div>
```

Note: `bluefin` has no generated loop in Phase 2 (it reuses existing assets) — if `assets/work/bluefin.*` is absent, `work-preview.js` simply leaves the static `images/bluefin.png` in place. To give Bluefin a loop too, add it to Task 6.

- [ ] **Step 2: Append work-band CSS**

```css
.work-band{background:var(--dark);color:var(--cream);border-top:0}
.work-band .section-title,.work-band .section-lede{color:var(--cream)}
.work-band .eyebrow .bar{background:#322d24}
.work-feature{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:44px}
.wcard{background:#1b1812;border-color:#322d24;color:var(--cream)}
.wcard .card-media{aspect-ratio:16/10;background:#13110c}
.wcard .card-media img,.wcard .card-media video{width:100%;height:100%;object-fit:cover}
.wcard .card-media video{position:absolute;inset:0;opacity:0;transition:opacity .5s}
.wcard .card-media.playing video{opacity:1}
.wcard .card-cat{color:var(--dark-muted)}
.work-all{margin-top:28px;border-color:var(--cream);color:var(--cream)}
@media (max-width:760px){.work-feature{grid-template-columns:1fr}}
```

- [ ] **Step 3: Write `js/work-preview.js`**

```js
// js/work-preview.js
import { shouldPlay } from './lib/preview.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);

document.querySelectorAll('.card-media[data-loop]').forEach((media) => {
  const base = media.getAttribute('data-loop');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
  video.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
  // If the loop assets don't exist, the video stays invisible and the static img shows.
  video.addEventListener('error', () => { media.classList.remove('playing'); }, true);
  media.appendChild(video);

  if (reduce) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (shouldPlay(e.intersectionRatio, 0.5)) {
        media.classList.add('playing');
        video.play().catch(() => media.classList.remove('playing'));
      } else { media.classList.remove('playing'); video.pause(); }
    });
  }, { threshold: [0, 0.5, 1] });
  io.observe(media);
});
```

- [ ] **Step 4: Verify** — reload. **Acceptance:** the dark Work band shows 4 floating cards; as each scrolls into view its Higgsfield loop fades in and plays (SooPork/Zielo/Etuga; Bluefin static unless its loop was generated); scrolling out pauses it. Reduce-motion: static images only. "See all work" links to `work.html`.

- [ ] **Step 5: Commit**

```bash
git add index.html css/styles.css js/work-preview.js
git commit -m "Add Selected Work band + in-view loop playback"
```

### Task 17: `work.html` — full index + View Transitions

**Files:**
- Create: `work.html`
- Modify: `js/main.js` (wire View Transitions on internal links)

- [ ] **Step 1: Create `work.html`** (same head/nav/footer + CDN + module scripts as `index.html`; body below)

```html
<main class="work-page">
  <section class="section">
    <div class="wrap">
      <div class="eyebrow"><span class="mono" style="color:var(--accent)">/ Selected work</span><span class="bar"></span></div>
      <h1 class="section-title">A few of the sites <em>we've built.</em></h1>
    </div>
  </section>

  <section class="section work-band">
    <div class="wrap">
      <div class="mono r" style="margin-bottom:18px">Featured</div>
      <div class="work-feature">
        <a class="card wcard r" href="Bluefin/"><div class="card-media" data-loop="assets/work/bluefin"><img src="images/bluefin.png" alt="Bluefin website"></div><div class="card-meta"><span class="card-name">Bluefin</span><span class="card-cat">Restaurant</span></div></a>
        <a class="card wcard r" href="soopork.html"><div class="card-media" data-loop="assets/work/soopork"><img src="images/soopork.png" alt="SooPork website"></div><div class="card-meta"><span class="card-name">SooPork</span><span class="card-cat">Restaurant</span></div></a>
        <a class="card wcard r" href="zielobar.html"><div class="card-media" data-loop="assets/work/zielo"><img src="images/zielo.png" alt="Zielo Bar website"></div><div class="card-meta"><span class="card-name">Zielo Bar</span><span class="card-cat">Bar</span></div></a>
        <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="mono r" style="margin-bottom:18px">More work</div>
      <div class="work-more">
        <a class="card r" href="cafedelolita.html"><div class="card-media"><img src="images/jerric-portrait.png" alt="Café de Lolita"></div><div class="card-meta"><span class="card-name">Café de Lolita</span><span class="card-cat">Café</span></div></a>
        <a class="card r" href="niji.html"><div class="card-media placeholder"></div><div class="card-meta"><span class="card-name">Niji</span><span class="card-cat">Restaurant</span></div></a>
        <a class="card r" href="cottoncatcafe.html"><div class="card-media placeholder"></div><div class="card-meta"><span class="card-name">Cotton Cat</span><span class="card-cat">Café</span></div></a>
        <a class="card r" href="brooklyncoffee.html"><div class="card-media placeholder"></div><div class="card-meta"><span class="card-name">Brooklyn Coffee</span><span class="card-cat">Café</span></div></a>
        <a class="card r" href="hqcoffee.html"><div class="card-media placeholder"></div><div class="card-meta"><span class="card-name">HQ Coffee</span><span class="card-cat">Café</span></div></a>
        <a class="card r" href="miransrestaurant.html"><div class="card-media placeholder"></div><div class="card-meta"><span class="card-name">Miran's</span><span class="card-cat">Restaurant</span></div></a>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="wrap" style="text-align:center">
      <h2 class="section-title">Your site, <em>next.</em></h2>
      <a class="btn" href="index.html#contact" style="margin-top:20px"><span data-t="hero_cta1">Start a project</span> →</a>
    </div>
  </section>
</main>
```

- [ ] **Step 2: Append work-page CSS to `css/styles.css`**

```css
.work-page{padding-top:90px}
.work-more{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:30px}
.work-more .card-media{aspect-ratio:16/10}
.work-more .card-media img{width:100%;height:100%;object-fit:cover}
.card-media.placeholder{background:repeating-linear-gradient(45deg,#e7ddc6,#e7ddc6 8px,#ddd0b3 8px,#ddd0b3 16px)}
@media (max-width:760px){.work-more{grid-template-columns:1fr 1fr}}
@media (max-width:480px){.work-more{grid-template-columns:1fr}}
```

- [ ] **Step 3: Wire View Transitions in `js/main.js`** — add inside `DOMContentLoaded`, after `initForm()`:

```js
import { navigateWithTransition } from './lib/transitions.js';
// …
document.querySelectorAll('a[href$=".html"], a.brand, a.work-all').forEach((a) => {
  const href = a.getAttribute('href');
  if (!href || a.target === '_blank' || href.startsWith('http')) return;
  a.addEventListener('click', (e) => { e.preventDefault(); navigateWithTransition(href, { doc: document, loc: location }); });
});
```
(Add the `import` line to the top of `js/main.js` with the others.)

- [ ] **Step 4: Verify** — open `http://localhost:8000/work.html` and navigate Home↔Work. **Acceptance:** Work page renders featured (animated) + more-work (static) grids + CTA; nav between pages is a smooth cross-fade where supported (Chrome), a normal load elsewhere; reduce-motion unaffected. Polish with **frontend-design**.

- [ ] **Step 5: Commit**

```bash
git add work.html css/styles.css js/main.js
git commit -m "Add work.html + View Transitions navigation"
```

---

## Phase 7 — Performance, accessibility, cleanup

### Task 18: Performance & accessibility pass

**Files:**
- Modify: `index.html`, `work.html`, `css/styles.css`, `js/hero.js` as needed

- [ ] **Step 1: Lazy/deferred media** — confirm `loading="lazy"` on all `.work-more` and static `<img>`; `preload="none"` on all `<video>`; hero frames load via JS (already deferred). Add `decoding="async"` to content images.

- [ ] **Step 2: Pause offscreen work canvases/videos** — already handled by `work-preview.js`. Confirm hero particle loop also pauses when the hero is scrolled fully out of view (add an IntersectionObserver in `initParticles` that stops/starts the rAF loop).

```js
// in initParticles, after starting the loop:
let running = true, rafId;
const tick = () => { if (!running) return; draw(); rafId = requestAnimationFrame(tick); };
new IntersectionObserver(([e]) => { running = e.isIntersecting; if (running) tick(); else cancelAnimationFrame(rafId); }, { threshold: 0 }).observe(canvas);
```
(Replace the bare `loop()` call with this guarded version.)

- [ ] **Step 3: Accessibility** — verify: keyboard focus reaches nav links, lang buttons, cards, form; visible focus ring (add `:focus-visible{outline:2px solid var(--accent);outline-offset:2px}` to `styles.css`); all content `<img>` have real `alt`; decorative canvases/video are `aria-hidden`; `role="status"` on the form note announces results; color contrast of body text on paper and cream on dark meets AA.

- [ ] **Step 4: Reduced-motion full sweep** — with emulation on, confirm across both pages: no pin/scrub (static poster), single particle frame, instant reveals, no count-up animation, no Lenis, no loop autoplay.

- [ ] **Step 5: Verify & lib regression** — Run: `npm test` → all suites PASS. Serve and re-check both pages on desktop + mobile widths, motion + reduced-motion.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Performance + accessibility pass"
```

### Task 19: Remove legacy hub artifacts & final review

**Files:**
- Delete: `index-old.html`, `hero-3d-preview.html` (only if the user confirms they're obsolete — otherwise leave)
- Verify: nothing references the removed pixel gimmicks

- [ ] **Step 1: Confirm with the user** before deleting `index-old.html` / `hero-3d-preview.html`. If unconfirmed, skip deletion (leave them — they don't affect the live hub).

- [ ] **Step 2: Grep for orphans** — Run: `grep -rn "pix-canvas\|mage-\|knight-scene\|landscape-scene\|UN-PIXELATE\|data-comment-anchor\|data-display\|data-theme\|data-accent" index.html work.html css/styles.css js/`
Expected: no matches (all legacy hooks gone from the new hub).

- [ ] **Step 3: Confirm deploy is unaffected** — `static.yml` uploads the repo as-is; `node_modules/` is gitignored and `tests/`, `package.json`, `vitest.config.js` are harmless static files that GitHub Pages simply won't serve. No workflow change needed.

- [ ] **Step 4: Final verification** — `npm test` green; both pages load with no console errors; hero wows on desktop, degrades on mobile and reduced-motion.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Remove legacy hub artifacts; final cleanup"
```

---

## Self-review (completed during authoring)

- **Spec coverage:** Architecture/files → Tasks 1,3,4,11; visual system §3 → Tasks 3,4,12,13 (+frontend-design polish); hero §4 → Tasks 5,12,15; sections §5 → Tasks 12–13,16–17; assets §6 → Tasks 5–6; motion §7 → Tasks 14–17; perf/a11y §8 → Task 18; retired §9 → Task 19; i18n kept → Task 7,14. Success criteria §10 map to verification steps in Tasks 12,15,16,18.
- **Placeholders:** The only `…` is the explicit verbatim copy of the existing 4-language dictionary (Task 7), with its source line range cited — a migration instruction, not a missing spec.
- **Type consistency:** `frameIndexForProgress(progress, count)`, `particleCount(w,h,density)`, `stepParticle(p,w,h)`, `shouldPlay(ratio,threshold)`, `translate(strings,lang,key)`, `applyTranslations(root,strings,lang)`, `navigateWithTransition(url,{doc,loc})`, `prefersReducedMotion(win)` are used identically in tests and entry modules. Hero reads frame count from `#hero[data-frames]`.
