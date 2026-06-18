# Add JianRan to Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 简然建材 JianRan as a featured work card (screenshot + scroll-through preview clip, external link) on both `index.html` and `work.html`, with the 5-card featured grid handled cleanly.

**Architecture:** Capture the live site (`https://www.chinabuildingmaterials.store/`) with Playwright into a screenshot + a short silent scroll clip, encode to web `webm`/`mp4` with ffmpeg, drop into `images/` + `assets/work/`, then append one featured `<a class="card wcard">` to the `.work-feature` grid on both pages and add one CSS rule so an odd trailing featured card spans full width.

**Tech Stack:** Zero-build static site; `js/work-preview.js` already autoplays `assets/work/<name>.{webm,mp4}` for any `.card-media[data-loop]` when it scrolls ≥50% into view; Playwright (Chromium, installed `--no-save`) for capture; ffmpeg (`libx264`/`libvpx-vp9`) for encoding; Vitest (24 tests, unaffected).

**Spec:** `docs/superpowers/specs/2026-06-18-jianran-portfolio-design.md`
**Branch:** `add-jianran-portfolio` (already created off `main`).
**Commit style:** terse, one commit per task. GitHub push is blocked in this environment — the final task hands the push to the user via `!`.

---

## Task 1: Pre-flight

**Files:** none (verification only)

- [ ] **Step 1: Confirm branch + clean tree**

Run: `cd /home/yurin/projects/luckyweb/LuckyWeb && git branch --show-current && git status --short`
Expected: `add-jianran-portfolio`, no uncommitted changes.

- [ ] **Step 2: Baseline tests + tools**

Run: `npm test && ls node_modules/.bin/playwright && which ffmpeg`
Expected: `Tests  24 passed (24)`; the playwright binary path prints; ffmpeg path prints. (If playwright is missing, `npm install --no-save playwright` — Chromium is already cached.)

---

## Task 2: Capture + encode the assets (main session — needs visual review)

**Files:**
- Create (throwaway, NOT committed): `_cap-jianran.mjs`
- Create: `images/jianran.png`, `assets/work/jianran.webm`, `assets/work/jianran.mp4`

> Run in the main session, not a blind subagent: the screenshot and clip need a visual check (lazy images loaded? scroll smooth? framing good?) and possible re-capture.

- [ ] **Step 1: Write the capture script**

Create `_cap-jianran.mjs` in the repo root (so ESM resolves `playwright` from local `node_modules`):

```js
import { chromium } from 'playwright';
import { readdirSync } from 'fs';
const URL = 'https://www.chinabuildingmaterials.store/';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport:{width:1440,height:900}, recordVideo:{ dir:'/tmp/jr-vid', size:{width:1440,height:900} } });
const p = await ctx.newPage();
p.setDefaultTimeout(60000);
await p.goto(URL, { waitUntil:'networkidle', timeout:60000 });
await p.waitForTimeout(2500);                       // hero settle + lazy load
await p.screenshot({ path:'/tmp/jianran-home.png' }); // base card image (16:10)
await p.evaluate(async () => {                       // smooth scroll top->bottom over ~6s
  const h = Math.max(0, document.body.scrollHeight - window.innerHeight);
  const steps = 120, dt = 6000/steps;
  for (let i=0;i<=steps;i++){ window.scrollTo(0, h*(i/steps)); await new Promise(r=>setTimeout(r,dt)); }
});
await p.waitForTimeout(600);
await ctx.close();                                   // finalizes the webm
await b.close();
console.log('recorded:', readdirSync('/tmp/jr-vid'));
```

- [ ] **Step 2: Run the capture**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
rm -rf /tmp/jr-vid && node _cap-jianran.mjs
ls -lh /tmp/jianran-home.png /tmp/jr-vid/
```
Expected: prints the recorded `.webm` filename; `/tmp/jianran-home.png` exists (~1440×900). View `/tmp/jianran-home.png` — confirm the homepage rendered (hero + imagery loaded, not a blank/coming-soon state). If blank, increase the `waitForTimeout` and re-run.

- [ ] **Step 3: Encode the base image (1280×800, 16:10)**

```bash
ffmpeg -y -v error -i /tmp/jianran-home.png -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" images/jianran.png
ls -lh images/jianran.png
```
Expected: writes `images/jianran.png` (≈0.5–1.5MB, in line with the other work PNGs).

- [ ] **Step 4: Encode the preview clip (webm + mp4, 1280×800, silent, ~8s)**

```bash
SRC=$(ls -1t /tmp/jr-vid/*.webm | head -1)
ffmpeg -y -v error -i "$SRC" -an -c:v libvpx-vp9 -b:v 0 -crf 36 -t 8 \
  -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" assets/work/jianran.webm
ffmpeg -y -v error -i "$SRC" -an -c:v libx264 -crf 26 -preset slow -movflags +faststart -t 8 \
  -vf "scale=1280:800:force_original_aspect_ratio=increase,crop=1280:800" assets/work/jianran.mp4
ls -lh assets/work/jianran.*
```
Expected: writes `assets/work/jianran.webm` + `jianran.mp4`, each roughly ≤800KB (comparable to `soopork`/`zielo`/`etuga`). If the mp4 is much larger, raise `-crf` to 28 and re-run that line. Extract a couple of frames to eyeball the scroll (`ffmpeg -v error -ss 1 -i assets/work/jianran.mp4 -frames:v 1 /tmp/jr-f1.png`, and `-ss 5`); confirm it shows the site scrolling, not a frozen/blank frame.

- [ ] **Step 5: Remove the throwaway script + commit the assets**

```bash
rm -f _cap-jianran.mjs
git add images/jianran.png assets/work/jianran.webm assets/work/jianran.mp4
git commit -m "Add JianRan screenshot + scroll-preview clip"
git status --short   # expect clean (no _cap-jianran.mjs tracked)
```

---

## Task 3: Add the featured card to both pages

**Files:**
- Modify: `index.html` (after the Etuga card, line ~76)
- Modify: `work.html` (after the Etuga card, line ~42)

- [ ] **Step 1: index.html — append the card after the Etuga card**

Find this exact line in `index.html`:

```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga Guesthouse website"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
```

Replace it with that same line, plus the new JianRan card on the next line (same 10-space indentation):

```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga Guesthouse website"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
          <a class="card wcard r" href="https://www.chinabuildingmaterials.store/" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jianran"><img src="images/jianran.png" alt="简然建材 JianRan website"></div><div class="card-meta"><span class="card-name">简然建材 JianRan</span><span class="card-cat">Building materials</span></div></a>
```

- [ ] **Step 2: work.html — append the card after the Etuga card**

Find this exact line in `work.html` (note: the alt text differs from index.html — it's `alt="Etuga"`):

```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
```

Replace it with that same line plus the new JianRan card on the next line:

```html
          <a class="card wcard r" href="https://luckywebtemplate.org" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/etuga"><img src="images/etuga.png" alt="Etuga"></div><div class="card-meta"><span class="card-name">Etuga</span><span class="card-cat">Guesthouse</span></div></a>
          <a class="card wcard r" href="https://www.chinabuildingmaterials.store/" target="_blank" rel="noopener"><div class="card-media" data-loop="assets/work/jianran"><img src="images/jianran.png" alt="简然建材 JianRan website"></div><div class="card-meta"><span class="card-name">简然建材 JianRan</span><span class="card-cat">Building materials</span></div></a>
```

- [ ] **Step 3: Verify both pages**

Run: `cd /home/yurin/projects/luckyweb/LuckyWeb && grep -c 'data-loop="assets/work/jianran"' index.html work.html`
Expected: `index.html:1` and `work.html:1` (one card each). Also `grep -c "work/jianran" index.html work.html` to be sure no duplicate.

- [ ] **Step 4: Commit**

```bash
git add index.html work.html
git commit -m "Add JianRan featured work card to home + work pages"
```

---

## Task 4: Full-width trailing featured card (CSS)

**Files:**
- Modify: `css/styles.css` (after the `.work-feature` rule, line ~131)

- [ ] **Step 1: Add the rule**

Find this exact line:

```css
.work-feature{display:grid;grid-template-columns:repeat(2,1fr);gap:18px;margin-top:44px}
```

Immediately after it, add a new line:

```css
.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}
```

This makes an odd-numbered trailing card (the 5th, JianRan) span both columns so the last row isn't a lone half-width card. Mobile is already single-column (`@media (max-width:760px){.work-feature{grid-template-columns:1fr}}`), so this only affects ≥760px.

- [ ] **Step 2: Verify**

Run: `grep -n "last-child:nth-child(odd)" css/styles.css`
Expected: exactly one match, directly after the `.work-feature{...}` line.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "Span an odd trailing featured card full-width"
```

---

## Task 5: Verify on desktop + mobile

**Files:**
- Create (throwaway, NOT committed): `_verify-jianran.mjs`

- [ ] **Step 1: Write the verification harness**

Create `_verify-jianran.mjs` in the repo root:

```js
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const page of ['index.html','work.html']) {
  for (const d of [{n:'desktop',w:1440,h:900,m:false},{n:'mobile',w:390,h:844,m:true}]) {
    const p = await b.newPage({ viewport:{width:d.w,height:d.h}, deviceScaleFactor:1, isMobile:d.m });
    p.setDefaultTimeout(30000);
    await p.goto(`http://127.0.0.1:8000/${page}`, { waitUntil:'commit' });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const a=[...document.querySelectorAll('.work-feature a.wcard')].find(x=>x.querySelector('[data-loop="assets/work/jianran"]'));
      return { found: !!a, href: a?.getAttribute('href'), target: a?.getAttribute('target'),
               overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
               cards: document.querySelectorAll('.work-feature a.wcard').length };
    });
    // scroll the card into view to trigger the preview autoplay
    await p.evaluate(() => document.querySelector('[data-loop="assets/work/jianran"]')?.scrollIntoView({block:'center'}));
    await p.waitForTimeout(1200);
    await p.screenshot({ path:`/tmp/jr-${page.replace('.html','')}-${d.n}.png`, timeout:15000 }).catch(()=>{});
    console.log(page, d.n, JSON.stringify(r));
    await p.close();
  }
}
await b.close();
```

- [ ] **Step 2: Serve + run**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
fuser -k 8000/tcp 2>/dev/null; (python3 -m http.server 8000 --bind 127.0.0.1 >/tmp/srv.log 2>&1 &) ; sleep 1
node _verify-jianran.mjs
fuser -k 8000/tcp 2>/dev/null
```
Expected (all four lines): `found:true`, `href:"https://www.chinabuildingmaterials.store/"`, `target:"_blank"`, `overflow:false`, `cards:5`.

- [ ] **Step 3: Eyeball the screenshots**

Open `/tmp/jr-index-desktop.png`, `/tmp/jr-work-desktop.png`, `/tmp/jr-index-mobile.png`, `/tmp/jr-work-mobile.png`. Confirm: the JianRan card renders as the full-width trailing featured card on desktop, single-column on mobile, image/clip visible, label `简然建材 JianRan / Building materials`, no layout break, no horizontal scroll.

- [ ] **Step 4: Regression + cleanup**

```bash
npm test                       # expect Tests 24 passed (24)
rm -f _verify-jianran.mjs
git status --short             # expect clean (no harness tracked)
```

---

## Task 6: Finish — clean tree, hand off push

**Files:** none

- [ ] **Step 1: Confirm branch + no leaked dev artifacts**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
git status --short && git log --oneline main..add-jianran-portfolio
git diff main --name-only | grep -E "package|node_modules|_cap-|_verify-" || echo "no dev artifacts ✓"
```
Expected: clean tree; log shows the spec + Task 2/3/4 commits; no package/node_modules/harness files in the diff.

- [ ] **Step 2: Merge to main locally (fast-forward)**

```bash
git checkout main && git merge --ff-only add-jianran-portfolio && git log --oneline -1
```
Expected: `main` fast-forwards to the JianRan work.

- [ ] **Step 3: Hand the push to the user**

GitHub push is blocked here. Tell the user to run, via the `!` prefix:

```
!git -C /home/yurin/projects/luckyweb/LuckyWeb push origin main
```

Then offer to delete the merged `add-jianran-portfolio` branch.

---

## Self-review (against the spec)

- **Spec "Goals" (featured card, both pages, external link)** → Task 3. ✓
- **Spec "Assets" (screenshot + webm/mp4, 16:10, no jpg)** → Task 2 (Steps 3–4 produce png + webm + mp4 at 1280×800; no jpg). ✓
- **Spec "Capture method" (Playwright screenshot + scroll recording, lazy-load wait)** → Task 2 Steps 1–2 (`networkidle` + `waitForTimeout`, smooth scroll). ✓
- **Spec "Markup"** → Task 3 uses the exact card HTML with name `简然建材 JianRan`, category `Building materials`, link `https://www.chinabuildingmaterials.store/`, `target="_blank" rel="noopener"`, `data-loop="assets/work/jianran"`. ✓
- **Spec "5-card grid layout" (full-width odd trailing)** → Task 4 (`.work-feature > a:last-child:nth-child(odd){grid-column:1/-1}`). ✓
- **Spec "Verification"** → Task 5 (both pages, desktop+mobile, link/target, overflow, cards:5, autoplay, npm test). ✓
- **Spec constraints (zero-build, no committed dev deps)** → Playwright `--no-save`; `_cap-`/`_verify-` scripts removed before commit (Task 2 Step 5, Task 5 Step 4); Task 6 Step 1 guards against leaks. ✓
- **Filename consistency:** `images/jianran.png`, `assets/work/jianran.{webm,mp4}`, `data-loop="assets/work/jianran"` identical across Tasks 2–3. ✓
- **Placeholder scan:** the only runtime substitution is `$SRC` (resolved by `ls -1t` in Task 2 Step 4) — not a plan gap. No TBD/TODO. ✓
