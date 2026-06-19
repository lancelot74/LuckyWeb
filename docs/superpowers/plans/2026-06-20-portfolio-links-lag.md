# Portfolio links + Jijie card + work-band lag — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repoint the Etuga card to `etuga.mn`, add a Jijie Wood Flooring featured card, return the JianRan card to normal size, and stop the work-band lag by playing only the single most-visible preview clip at a time.

**Architecture:** Pure tested helper `indexOfMostVisible()` picks one card to play; `work-preview.js` becomes a single coordinator that plays that card and pauses the rest. The Jijie card follows the established featured-card pattern (captured screenshot + scroll clip). Two HTML link/markup edits and one CSS deletion round it out.

**Tech Stack:** Zero-build static site; `js/work-preview.js` + `js/lib/preview.js` (ES modules, unit-tested with Vitest); Playwright (`--no-save`) + ffmpeg for capture; Vitest (currently 24 tests).

**Spec:** `docs/superpowers/specs/2026-06-20-portfolio-links-lag-design.md`
**Branch:** `portfolio-links-lag` (already created off `main`).
**Commit style:** terse, one commit per task. GitHub push is blocked here — final task hands the push to the user via `!`.

---

## Task 1: Pre-flight

**Files:** none

- [ ] **Step 1: Branch + clean tree + baseline**

Run: `cd /home/yurin/projects/luckyweb/LuckyWeb && git branch --show-current && git status --short && npm test 2>&1 | tail -4`
Expected: `portfolio-links-lag`, clean tree, `Tests  24 passed (24)`.

- [ ] **Step 2: Tools present**

Run: `ls node_modules/.bin/playwright && which ffmpeg`
Expected: both paths print. (If playwright missing: `npm install --no-save playwright`; Chromium is cached.)

---

## Task 2: `indexOfMostVisible` helper (TDD)

**Files:**
- Modify: `js/lib/preview.js`
- Test: `tests/preview.test.js`

- [ ] **Step 1: Write failing tests**

Append to `tests/preview.test.js` (keep the existing `shouldPlay` block and the existing import line; add `indexOfMostVisible` to the import):

Change the import line:
```js
import { shouldPlay, indexOfMostVisible } from '../js/lib/preview.js';
```
Append after the existing `describe('shouldPlay', …)` block:
```js
describe('indexOfMostVisible', () => {
  it('returns -1 for empty', () => expect(indexOfMostVisible([], 0.5)).toBe(-1));
  it('returns -1 when all below min', () => expect(indexOfMostVisible([0.1, 0.4], 0.5)).toBe(-1));
  it('returns the only one at/above min', () => expect(indexOfMostVisible([0.2, 0.6, 0.1], 0.5)).toBe(1));
  it('returns the max when not first', () => expect(indexOfMostVisible([0.5, 0.9, 0.7], 0.5)).toBe(1));
  it('breaks ties to the first index', () => expect(indexOfMostVisible([0.8, 0.8], 0.5)).toBe(0));
  it('counts a ratio exactly at min', () => expect(indexOfMostVisible([0.5], 0.5)).toBe(0));
});
```

- [ ] **Step 2: Run — verify fail**

Run: `npm test 2>&1 | tail -12`
Expected: FAIL — `indexOfMostVisible is not a function` (or import error).

- [ ] **Step 3: Implement**

Append to `js/lib/preview.js`:
```js
// Index of the highest ratio that is >= min, or -1 if none. Ties resolve to the lowest index.
export function indexOfMostVisible(ratios, min = 0.5) {
  let best = -1, bestRatio = -Infinity;
  for (let i = 0; i < ratios.length; i++) {
    if (ratios[i] >= min && ratios[i] > bestRatio) { best = i; bestRatio = ratios[i]; }
  }
  return best;
}
```

- [ ] **Step 4: Run — verify pass**

Run: `npm test 2>&1 | tail -6`
Expected: `Tests  30 passed (30)` (24 existing + 6 new).

- [ ] **Step 5: Commit**

```bash
git add js/lib/preview.js tests/preview.test.js
git commit -m "Add indexOfMostVisible preview helper"
```

---

## Task 3: Single-active work-preview coordinator

**Files:**
- Modify: `js/work-preview.js` (full rewrite of the module body)

- [ ] **Step 1: Replace the module**

Replace the ENTIRE contents of `js/work-preview.js` with:

```js
// js/work-preview.js
import { indexOfMostVisible } from './lib/preview.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);
const cards = [...document.querySelectorAll('.card-media[data-loop]')];

// One <video> per card; preload nothing until it becomes the active (most-visible) clip.
const items = cards.map((media) => {
  const base = media.getAttribute('data-loop');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
  video.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
  // If the loop assets don't exist, the video errors and the static img stays visible.
  video.addEventListener('error', () => media.classList.remove('playing'), true);
  media.appendChild(video);
  return { media, video, ratio: 0 };
});

if (!reduce && items.length) {
  // Play only the single most-visible card; pause the rest so at most one clip decodes at a time.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const item = items.find((it) => it.media === e.target);
      if (item) item.ratio = e.intersectionRatio;
    }
    const active = indexOfMostVisible(items.map((it) => it.ratio), 0.5);
    items.forEach((it, i) => {
      if (i === active) {
        it.media.classList.add('playing');
        it.video.play().catch(() => it.media.classList.remove('playing'));
      } else {
        it.media.classList.remove('playing');
        it.video.pause();
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  items.forEach((it) => io.observe(it.media));
}
```

- [ ] **Step 2: Syntax + tests**

Run: `cd /home/yurin/projects/luckyweb/LuckyWeb && node --check js/work-preview.js && npm test 2>&1 | tail -4`
Expected: no syntax error; `Tests  30 passed (30)` (this module isn't unit-tested; confirms nothing broke).

- [ ] **Step 3: Commit**

```bash
git add js/work-preview.js
git commit -m "Play only the most-visible work preview at a time"
```

---

## Task 4: Repoint the Etuga card to etuga.mn

**Files:**
- Modify: `index.html` (Etuga card, line ~76)
- Modify: `work.html` (Etuga card, line ~42)

- [ ] **Step 1: index.html**

Find this exact line:
```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga Guesthouse website"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
```
Replace `href="https://luckywebtemplate.org"` with `href="https://etuga.mn"` (change ONLY the href; leave the rest identical).

- [ ] **Step 2: work.html**

Find this exact line (note `alt="Etuga"`):
```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
```
Replace `href="https://luckywebtemplate.org"` with `href="https://etuga.mn"`.

- [ ] **Step 3: Verify**

Run: `grep -c "luckywebtemplate.org" index.html work.html; grep -c 'href="https://etuga.mn"' index.html work.html`
Expected: `luckywebtemplate.org` → `0` in both; `etuga.mn` → `1` in both.

- [ ] **Step 4: Commit**

```bash
git add index.html work.html
git commit -m "Point Etuga card to etuga.mn"
```

---

## Task 5: Remove the full-width rule (JianRan back to normal)

**Files:**
- Modify: `css/styles.css` (line ~132)

- [ ] **Step 1: Delete the rule**

Find and delete this entire line:
```css
.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}
```
(It sits directly after `.work-feature{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:44px}` — leave that line.)

- [ ] **Step 2: Verify**

Run: `grep -c "last-child:nth-child(odd)" css/styles.css`
Expected: `0`.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "Remove full-width trailing featured card rule"
```

---

## Task 6: Capture + encode the Jijie assets (main session — needs visual review)

**Files:**
- Create (throwaway, NOT committed): `_cap-jijie.mjs`
- Create: `images/jijie.png`, `assets/work/jijie.webm`, `assets/work/jijie.mp4`

> Run in the main session: the screenshot + clip need a visual check and a content-window trim (the recording includes a blank page-load lead-in, as seen with the JianRan capture).

- [ ] **Step 1: Write the capture script**

Create `_cap-jijie.mjs` in the repo root:
```js
import { chromium } from 'playwright';
import { readdirSync } from 'fs';
const URL = 'https://jijiewoodflooring.com';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, recordVideo:{ dir:'/tmp/jj-vid', size:{width:1440,height:900} } });
const p = await ctx.newPage();
p.setDefaultTimeout(60000);
await p.goto(URL, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(2500);
await p.screenshot({ path:'/tmp/jijie-home.png' });
await p.evaluate(async () => {
  const h = Math.max(0, document.body.scrollHeight - window.innerHeight);
  const steps = 120, dt = 6000/steps;
  for (let i=0;i<=steps;i++){ window.scrollTo(0, h*(i/steps)); await new Promise(r=>setTimeout(r,dt)); }
});
await p.waitForTimeout(600);
await ctx.close();
await b.close();
console.log('recorded:', readdirSync('/tmp/jj-vid'));
```

- [ ] **Step 2: Run + check the screenshot**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
rm -rf /tmp/jj-vid && node _cap-jijie.mjs
ls -lh /tmp/jijie-home.png /tmp/jj-vid/
```
View `/tmp/jijie-home.png` — confirm the homepage rendered (hero + flooring imagery), not blank. If blank, raise the wait and re-run.

- [ ] **Step 3: Find the content window**

```bash
SRC=$(ls -1t /tmp/jj-vid/*.webm | head -1)
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$SRC"
for t in 1 2 3 4 6 8 10 12; do v=$(ffmpeg -v error -ss $t -i "$SRC" -frames:v 1 -vf "scale=8:5,format=gray" -f rawvideo - 2>/dev/null | od -An -tu1 | tr ' ' '\n' | grep -E '^[0-9]+$' | awk '{s+=$1;n++} END{printf "%.0f", s/n}'); echo "t=$t mean=$v"; done
```
Pick a START second `S` where real content is on screen (not the blank/near-white load frames) and a ~6–7s window that stays on content; extract a frame to confirm (`ffmpeg -v error -ss <S> -i "$SRC" -frames:v 1 /tmp/jj-check.png`).

- [ ] **Step 4: Encode (substitute `S` from Step 3)**

```bash
SRC=$(ls -1t /tmp/jj-vid/*.webm | head -1)
ffmpeg -y -v error -i /tmp/jijie-home.png -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" images/jijie.png
ffmpeg -y -v error -ss S -t 7 -i "$SRC" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" assets/work/jijie.webm
ffmpeg -y -v error -ss S -t 7 -i "$SRC" -an -c:v libx264 -crf 28 -preset slow -movflags +faststart -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" assets/work/jijie.mp4
ls -lh images/jijie.png assets/work/jijie.*
```
Expected: `jijie.png` ≈0.5–1.5MB; `jijie.mp4`/`jijie.webm` each ≤~1MB. Eyeball `/tmp/jj-check.png` and a mid frame of the mp4 to confirm a clean scroll.

- [ ] **Step 5: Remove the script + commit assets**

```bash
rm -f _cap-jijie.mjs
git add images/jijie.png assets/work/jijie.webm assets/work/jijie.mp4
git commit -m "Add Jijie Wood Flooring screenshot + scroll-preview clip"
git status --short   # expect clean
```

---

## Task 7: Add the Jijie featured card to both pages

**Files:**
- Modify: `index.html` (after the JianRan card)
- Modify: `work.html` (after the JianRan card)

- [ ] **Step 1: index.html — append after the JianRan card**

Find this exact line:
```html
          <a class="card wcard r" href="https://www.chinabuildingmaterials.store/" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jianran"><img src="images/jianran.png" alt="简然建材 JianRan website"></div><div class="card-meta"><span class="card-name">简然建材 JianRan</span><span class="card-cat">Building materials</span></div></a>
```
Replace it with that same line plus the new Jijie card on the next line (same 10-space indent):
```html
          <a class="card wcard r" href="https://www.chinabuildingmaterials.store/" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jianran"><img src="images/jianran.png" alt="简然建材 JianRan website"></div><div class="card-meta"><span class="card-name">简然建材 JianRan</span><span class="card-cat">Building materials</span></div></a>
          <a class="card wcard r" href="https://jijiewoodflooring.com" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jijie"><img src="images/jijie.png" alt="Jijie Wood Flooring website"></div><div class="card-meta"><span class="card-name">Jijie Wood Flooring</span><span class="card-cat">Flooring</span></div></a>
```

- [ ] **Step 2: work.html — append after the JianRan card**

The JianRan line in `work.html` is identical to the one above. Make the same insertion (append the same Jijie card line right after it).

- [ ] **Step 3: Verify**

Run: `grep -c 'data-loop="assets/work/jijie"' index.html work.html; grep -c 'class="card wcard' index.html work.html`
Expected: `jijie` → `1` in each; `card wcard` → `6` in each.

- [ ] **Step 4: Commit**

```bash
git add index.html work.html
git commit -m "Add Jijie Wood Flooring featured card to home + work pages"
```

---

## Task 8: Verify (pages, links, single-active playback, regression)

**Files:**
- Create (throwaway, NOT committed): `_verify-pll.mjs`

- [ ] **Step 1: Write the harness**

Create `_verify-pll.mjs` in the repo root:
```js
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const page of ['index.html','work.html']) {
  for (const d of [{n:'desktop',w:1440,h:900,m:false},{n:'mobile',w:390,h:844,m:true}]) {
    const p = await b.newPage({ viewport:{width:d.w,height:d.h}, deviceScaleFactor:1, isMobile:d.m });
    p.setDefaultTimeout(30000);
    await p.goto(`http://127.0.0.1:8000/${page}`, { waitUntil:'commit' });
    await p.waitForTimeout(2000);
    // scroll through the work band, sampling how many previews play at once
    let maxPlaying = 0;
    for (let y=0; y<=1; y+=0.12) {
      await p.evaluate((f)=>window.scrollTo(0, document.body.scrollHeight*f), y);
      await p.waitForTimeout(350);
      maxPlaying = Math.max(maxPlaying, await p.evaluate(()=>document.querySelectorAll('.card-media.playing').length));
    }
    const r = await p.evaluate(() => {
      const hrefs = [...document.querySelectorAll('.work-feature a.wcard')].map(a=>a.getAttribute('href'));
      return { cards: document.querySelectorAll('.work-feature a.wcard').length,
               etuga: hrefs.some(h=>h==='https://etuga.mn'),
               jijie: hrefs.some(h=>h==='https://jijiewoodflooring.com'),
               oldEtuga: hrefs.some(h=>h&&h.includes('luckywebtemplate')),
               overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    await p.evaluate(()=>document.querySelector('#work, .work-feature')?.scrollIntoView());
    await p.waitForTimeout(800);
    await p.screenshot({ path:`/tmp/pll-${page.replace('.html','')}-${d.n}.png`, timeout:15000 }).catch(()=>{});
    console.log(page, d.n, JSON.stringify({ ...r, maxPlaying }));
    await p.close();
  }
}
await b.close();
```

- [ ] **Step 2: Serve + run**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
fuser -k 8000/tcp 2>/dev/null; (python3 -m http.server 8000 --bind 127.0.0.1 >/tmp/srv.log 2>&1 &) ; sleep 1.2
node _verify-pll.mjs
fuser -k 8000/tcp 2>/dev/null
```
Expected (all four lines): `cards:6`, `etuga:true`, `jijie:true`, `oldEtuga:false`, `overflow:false`, and **`maxPlaying:1`** (the lag fix — never more than one clip playing; was up to ~4).

- [ ] **Step 3: Eyeball screenshots**

Open `/tmp/pll-index-desktop.png`, `/tmp/pll-work-desktop.png`, and the mobile pair. Confirm: 6 featured cards in a clean 3×2 grid on desktop (no oversized JianRan), 1-column on mobile, Jijie card present with `Jijie Wood Flooring / Flooring`.

- [ ] **Step 4: Regression + cleanup**

```bash
npm test                  # expect Tests 30 passed (30)
rm -f _verify-pll.mjs
git status --short        # expect clean
```

---

## Task 9: Finish — merge to main, hand off push

**Files:** none

- [ ] **Step 1: Confirm branch + no leaked artifacts**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
git status --short && git log --oneline main..portfolio-links-lag
git diff main --name-only | grep -E "package|node_modules|_cap-|_verify-" || echo "no dev artifacts ✓"
```
Expected: clean tree; log lists the spec + Task 2–7 commits; no package/node_modules/harness files.

- [ ] **Step 2: Merge to main (fast-forward)**

```bash
git checkout main && git merge --ff-only portfolio-links-lag && git log --oneline -1
```

- [ ] **Step 3: Hand the push to the user**

GitHub push is blocked here. Tell the user to run, via `!`:
```
!git -C /home/yurin/projects/luckyweb/LuckyWeb push origin main
```
Then offer to delete the merged `portfolio-links-lag` branch.

---

## Self-review (against the spec)

- **Etuga link** → Task 4 (both pages, href only). ✓
- **Remove full-width rule** → Task 5. ✓
- **Jijie assets (screenshot + webm/mp4, 16:10, no jpg)** → Task 6. ✓
- **Jijie markup (featured, both pages, name/category/link)** → Task 7 (`Jijie Wood Flooring` / `Flooring` / `https://jijiewoodflooring.com`, `data-loop="assets/work/jijie"`). ✓
- **Lag fix (single most-visible)** → Task 2 (`indexOfMostVisible` + tests) + Task 3 (coordinator rewrite). ✓
- **Verification (6 cards, links, maxPlaying:1, no overflow, npm test)** → Task 8. ✓
- **Constraints (zero-build, no committed dev deps)** → Playwright `--no-save`; `_cap-`/`_verify-` removed before commit (Tasks 6/8); Task 9 guards leaks. ✓
- **Naming consistency:** `indexOfMostVisible(ratios, min)` used identically in Tasks 2 and 3; `images/jijie.png` + `assets/work/jijie.{webm,mp4}` + `data-loop="assets/work/jijie"` identical in Tasks 6–7. ✓
- **Placeholder scan:** only intentional runtime substitutions are `S` (Task 6, chosen from frame sampling) and `$SRC` (resolved by `ls -1t`). No TBD/TODO. ✓
