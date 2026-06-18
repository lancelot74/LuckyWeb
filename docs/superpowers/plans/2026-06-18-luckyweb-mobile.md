# LuckyWeb Mobile / Phone-Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give phones a purpose-built portrait (9:16) Higgsfield hero — a smartphone whose screen builds the site, autoplay-looping — plus targeted responsive fixes (nav, type, spacing, tap targets).

**Architecture:** The desktop laptop scroll-scrub is untouched. On phones (`≤760px`) `js/hero.js` already swaps to a looping `<video>`; we point that video at a new portrait asset and center it, and add small mobile CSS overrides. The video is generated via Higgsfield (image→video), encoded locally with ffmpeg, and stored under `assets/hero/`.

**Tech Stack:** Zero-build static site; GSAP/ScrollTrigger/Lenis via CDN (desktop only); Higgsfield MCP (GPT Image 2 + Seedance 2.0) for the asset; ffmpeg (`libx264`/`libvpx-vp9`/`libwebp`, confirmed present) for encoding; Vitest (24 tests, unaffected).

**Spec:** `docs/superpowers/specs/2026-06-18-luckyweb-mobile-design.md`
**Branch:** `mobile-phone-hero` (already created off `main`).

**Ordering note / contingency:** Tasks 2–3 are asset-independent CSS and can land regardless of Higgsfield. Tasks 4–6 produce the asset and **require the Higgsfield MCP connected + credits** (it has been flaky this session). Tasks 7–8 wire the asset in and MUST come after the files exist (otherwise mobile shows a broken video/poster). If Higgsfield is unavailable, complete Tasks 1–3, pause, and resume at Task 4 when it reconnects.

**Commit style:** terse (`"Update X"` / imperative), one commit per task. Pushing to GitHub is blocked in this environment — the final task hands the push to the user via `!`.

---

## Task 1: Pre-flight

**Files:** none (verification only)

- [ ] **Step 1: Confirm branch and clean tree**

Run: `git -C /home/yurin/projects/luckyweb/LuckyWeb branch --show-current && git status --short`
Expected: prints `mobile-phone-hero` and no uncommitted changes.

- [ ] **Step 2: Baseline the unit tests (need node_modules)**

`node_modules` is gitignored and absent after the worktree cleanup. Install dev deps, then run tests.
Run: `cd /home/yurin/projects/luckyweb/LuckyWeb && npm install && npm test`
Expected: `Test Files  6 passed (6)` / `Tests  24 passed (24)`. (Registry is slow here — allow several minutes.)

- [ ] **Step 3: Confirm Higgsfield is reachable + has credit**

Use ToolSearch to load `mcp__claude_ai_Higgsfield__balance` (and `generate_image`/`generate_video`) if not already loaded, then call `balance`.
Expected: a positive credit balance. If the MCP is disconnected, record that and proceed to Tasks 2–3 only; return to Task 4 when it reconnects.

---

## Task 2: Nav pill + language-button tap targets (mobile)

**Files:**
- Modify: `css/styles.css` (the `@media (max-width:680px)` nav block, currently lines ~68–71)

- [ ] **Step 1: Replace the mobile nav media block**

Find this exact block:

```css
@media (max-width:680px){
  .nav{gap:12px;padding-left:16px}
  .nav a.lnk{display:none}
}
```

Replace with:

```css
@media (max-width:680px){
  .nav{gap:10px;padding:4px 8px 4px 16px}
  .nav a.lnk{display:none}
  .lang{gap:0;margin-left:2px}
  .lang button{padding:0 8px;min-height:40px;display:inline-flex;align-items:center}
  .nav .cta{padding:10px 13px}
}
@media (max-width:380px){
  .nav .brand{font-size:17px}
  .nav .cta{font-size:12px;padding:8px 11px}
}
```

Rationale: lifts the language buttons from an ~18px hit area to a 40px tap height (≈WCAG; a true 44px would visibly bloat the floating pill), and keeps brand + CTA + 4 language buttons from overflowing `calc(100vw - 32px)` down to ~360px.

- [ ] **Step 2: Verify nothing else matched**

Run: `grep -n "min-height:40px" css/styles.css`
Expected: exactly one match (the line just added).

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "Tighten mobile nav pill + enlarge language tap targets"
```

---

## Task 3: Hero headline clamp + section rhythm + hero-inner (mobile)

**Files:**
- Modify: `css/styles.css` (`.hero-h1` line ~83; the `@media (max-width:680px)` hero block line ~95)

- [ ] **Step 1: Lower the headline clamp floor**

Find:

```css
.hero-h1{font-family:var(--font-display);font-weight:400;font-size:clamp(58px,12.5vw,168px);line-height:.9;letter-spacing:-.028em;margin:18px 0 0;max-width:14ch}
```

Replace `clamp(58px,12.5vw,168px)` with `clamp(46px,12.5vw,168px)` (only the floor changes), giving:

```css
.hero-h1{font-family:var(--font-display);font-weight:400;font-size:clamp(46px,12.5vw,168px);line-height:.9;letter-spacing:-.028em;margin:18px 0 0;max-width:14ch}
```

Rationale: a 58px floor overflows ~320–360px screens; 46px lets the headline breathe while `12.5vw` still drives the size on larger phones.

- [ ] **Step 2: Add section + hero-inner mobile tuning to the existing ≤680 hero block**

Find:

```css
@media (max-width:680px){.hero-mid,.hero-stats{flex-direction:column;align-items:flex-start}.hero-stats .stat + .stat{border-left:0;border-top:1px solid rgba(236,230,216,.18)}}
```

Replace with:

```css
@media (max-width:680px){
  .hero-mid,.hero-stats{flex-direction:column;align-items:flex-start}
  .hero-stats .stat + .stat{border-left:0;border-top:1px solid rgba(236,230,216,.18)}
  .hero-inner{padding-top:20px}
  .section{padding:60px 0}
}
```

Rationale: trims the desktop 84px section rhythm to 60px on phones and pulls the hero content up so the looping phone video has room.

- [ ] **Step 3: Verify**

Run: `grep -n "clamp(46px,12.5vw,168px)\|padding:60px 0" css/styles.css`
Expected: two matches (headline floor + mobile section padding).

- [ ] **Step 4: Commit**

```bash
git add css/styles.css
git commit -m "Mobile type scale + tighter section rhythm"
```

---

## Task 4: Generate the portrait still (Higgsfield)

**Files:** none committed yet (produces a remote image / job id)

> Entry point: the `higgsfield-generate` skill, or the `mcp__claude_ai_Higgsfield__generate_image` tool directly. Requires the MCP connected (Task 1, Step 3).

- [ ] **Step 1: Generate a 9:16 portrait still — GPT Image 2**

Call `generate_image` with **portrait 9:16** and this prompt (matches the desktop hero's dark/ember palette):

> "Cinematic product shot of a single modern smartphone standing upright on a dark glossy reflective surface, deep charcoal #16140F background, one warm ember-orange (#C7451B) rim light grazing the phone's edge, soft falloff into shadow, screen dark/off, subtle reflection beneath, premium minimal tech aesthetic, volumetric haze, shot on 85mm, vertical 9:16 composition with the phone centered and headroom above."

- [ ] **Step 2: Review the still**

View the result (`job_display` / `reveal_generation`). Confirm: vertical framing, phone centered with headroom, dark+ember palette, screen readable as "off/dim." If off-brand (wrong palette, phone too small, landscape), regenerate with adjusted prompt before continuing.

- [ ] **Step 3: Record the image id**

Note the returned media/job id (and URL) — it is the input for Task 5. No git commit (asset not local yet).

---

## Task 5: Animate the still into a 9:16 build video (Higgsfield Seedance 2.0)

**Files:** none committed yet (produces a remote video / job id)

- [ ] **Step 1: Image→video with Seedance 2.0, 9:16**

Call `generate_video` (model Seedance 2.0) with the Task 4 image as the input media (`medias`/job id — never a raw URL per MCP rules; import via `media_import_url` if only a URL is available), aspect **9:16**, ~5s, and this motion prompt:

> "The phone screen powers on and assembles a website: clean UI blocks fade and slide in from top to bottom, then a slow gentle scroll through the page; very slow cinematic push-in on the phone, ember rim light steady, dark background, premium and smooth. Start and end on a calm state so the clip loops cleanly."

- [ ] **Step 2: Poll to completion**

Use `job_status` until the job is done, then `job_display` to view it.

- [ ] **Step 3: Review the video**

Confirm: screen visibly builds the site, motion is smooth, palette matches, and the first/last frames are close enough that an autoplay loop won't jar badly. Regenerate if the build isn't legible or the loop seam is harsh.

- [ ] **Step 4: Upscale (optional) + capture the download URL**

Optionally `upscale_video` to 1080p. Record the final downloadable URL for Task 6.

---

## Task 6: Download + encode into `assets/hero/`

**Files:**
- Create: `assets/hero/hero-phone.webm`, `assets/hero/hero-phone.mp4`, `assets/hero/hero-phone-poster.webp`

- [ ] **Step 1: Download the source clip**

Run (substitute the real URL from Task 5):
```bash
curl -L -o /tmp/hero-phone-src.mp4 "<FINAL_VIDEO_URL>"
ls -lh /tmp/hero-phone-src.mp4
```
Expected: a non-empty mp4/mov downloaded.

- [ ] **Step 2: Encode the WebM (VP9), stripped audio, 720×1280**

```bash
cd /home/yurin/projects/luckyweb/LuckyWeb
ffmpeg -y -i /tmp/hero-phone-src.mp4 -an -c:v libvpx-vp9 -b:v 0 -crf 34 \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  assets/hero/hero-phone.webm
```
Expected: writes `assets/hero/hero-phone.webm`.

- [ ] **Step 3: Encode the MP4 (H.264), faststart, stripped audio, 720×1280**

```bash
ffmpeg -y -i /tmp/hero-phone-src.mp4 -an -c:v libx264 -crf 26 -preset slow -movflags +faststart \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  assets/hero/hero-phone.mp4
```
Expected: writes `assets/hero/hero-phone.mp4`.

- [ ] **Step 4: Extract the poster (first frame) as WebP**

```bash
ffmpeg -y -i /tmp/hero-phone-src.mp4 -frames:v 1 \
  -vf "scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280" \
  -c:v libwebp -quality 82 assets/hero/hero-phone-poster.webp
```
Expected: writes `assets/hero/hero-phone-poster.webp`.

- [ ] **Step 5: Sanity-check sizes**

Run: `ls -lh assets/hero/hero-phone.*`
Expected: `.mp4` and `.webm` each roughly ≤1 MB (comparable to the 549 KB landscape `hero.mp4`); poster a few tens of KB. If the mp4 is much larger, raise `-crf` to 28 and re-run Step 3.

- [ ] **Step 6: Commit**

```bash
git add assets/hero/hero-phone.webm assets/hero/hero-phone.mp4 assets/hero/hero-phone-poster.webp
git commit -m "Add portrait phone-hero video + poster"
```

---

## Task 7: Wire the portrait video into the mobile hero

**Files:**
- Modify: `js/hero.js` — `initHero` (currently lines ~20–27)

- [ ] **Step 1: Update the reduce + mobile branches**

Find:

```js
  if (reduce) { scrub.style.display = 'none'; poster.style.display = 'block'; return; } // static final frame
  if (isMobile || !window.gsap || !window.ScrollTrigger) {
    // Mobile / no-GSAP fallback: poster + looping video (no pinned scrub)
    scrub.style.display = 'none'; poster.style.display = 'none';
    video.loop = true; video.style.display = 'block';
    video.play().catch(() => { video.style.display = 'none'; poster.style.display = 'block'; });
    return;
  }
```

Replace with:

```js
  // On phones, use the portrait phone-build asset (the HTML keeps the landscape laptop for the
  // desktop no-GSAP fallback). Set it before any branch returns so every fallback shows portrait.
  if (isMobile) {
    poster.src = 'assets/hero/hero-phone-poster.webp';
    video.poster = 'assets/hero/hero-phone-poster.webp';
    video.innerHTML =
      '<source src="assets/hero/hero-phone.webm" type="video/webm">' +
      '<source src="assets/hero/hero-phone.mp4" type="video/mp4">';
    video.load();
  }
  if (reduce) { scrub.style.display = 'none'; poster.style.display = 'block'; return; } // static frame
  if (isMobile || !window.gsap || !window.ScrollTrigger) {
    // Mobile / no-GSAP fallback: poster + looping video (no pinned scrub)
    scrub.style.display = 'none'; poster.style.display = 'none';
    video.loop = true; video.style.display = 'block';
    video.play().catch(() => { video.style.display = 'none'; poster.style.display = 'block'; });
    return;
  }
```

(`isMobile`, `scrub`, `poster`, `video` are already declared just above this block, so they are in scope.)

- [ ] **Step 2: Syntax-check**

Run: `node --check js/hero.js`
Expected: no output (valid).

- [ ] **Step 3: Unit tests still green**

Run: `npm test`
Expected: `Tests  24 passed (24)` (this file isn't unit-tested; confirms nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add js/hero.js
git commit -m "Use portrait phone video on mobile hero"
```

---

## Task 8: Center the portrait video on mobile (CSS)

**Files:**
- Modify: `css/styles.css` (insert a `@media (max-width:760px)` rule near the hero block, after the `.hero-cue` rule line ~94)

- [ ] **Step 1: Add the object-position override**

Find:

```css
.hero-cue{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);z-index:3;color:#cfc8ba}
```

Immediately after it, add:

```css
@media (max-width:760px){.hero-video{object-position:center}}
```

Rationale: the shared rule anchors media at `center bottom` (for the laptop base). The portrait phone should be vertically centered. Scoped to `≤760px` to match the `isMobile` breakpoint in `js/hero.js`.

- [ ] **Step 2: Verify**

Run: `grep -n "hero-video{object-position:center}" css/styles.css`
Expected: one match.

- [ ] **Step 3: Commit**

```bash
git add css/styles.css
git commit -m "Center portrait hero video on mobile"
```

---

## Task 9: Verify on emulated phones + regression

**Files:**
- Create (throwaway, NOT committed): `_shot-mobile.mjs`

- [ ] **Step 1: Write the verification harness**

Create `_shot-mobile.mjs`:

```js
import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const d of [{n:'iphone',w:390,h:844},{n:'android',w:360,h:640}]) {
  const page = await browser.newPage({ viewport:{width:d.w,height:d.h}, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  page.setDefaultTimeout(60000);
  await page.goto('http://127.0.0.1:8000/index.html', { waitUntil:'commit', timeout:60000 });
  await page.waitForTimeout(3500);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  await page.screenshot({ path:`/tmp/m-${d.n}-hero.png`, timeout:15000 }).catch(()=>{});
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight*0.45));
  await page.waitForTimeout(800);
  await page.screenshot({ path:`/tmp/m-${d.n}-mid.png`, timeout:15000 }).catch(()=>{});
  console.log(d.n, 'horizontal-overflow:', overflow);
  await page.close();
}
await browser.close();
```

- [ ] **Step 2: Serve + run (install Playwright Chromium if needed)**

```bash
fuser -k 8000/tcp 2>/dev/null; (python3 -m http.server 8000 --bind 127.0.0.1 >/tmp/srv.log 2>&1 &) ; sleep 1
npx playwright install chromium    # slow registry; only if not already installed
node _shot-mobile.mjs
```
Expected: prints `iphone horizontal-overflow: false` and `android horizontal-overflow: false`. (If Playwright can't be installed, skip the harness and verify by opening the site on a real phone instead.)

- [ ] **Step 3: Inspect the screenshots**

Open `/tmp/m-iphone-hero.png`, `/tmp/m-android-hero.png`, and the `-mid` shots. Confirm: portrait phone video fills the hero and is centered; headline + stats legible over it; nav pill fits without wrapping; mid-page sections have comfortable spacing; **no horizontal scrollbar**.

- [ ] **Step 4: Desktop unchanged**

Resize check: load at 1440×900, confirm the laptop hero still pins and builds on scroll (the desktop path is unchanged by this plan). Run `npm test` once more → `24 passed`.

- [ ] **Step 5: Remove the throwaway harness**

```bash
rm -f _shot-mobile.mjs
git status --short
```
Expected: no tracked changes from the harness (it was never added).

---

## Task 10: Finish — clean tree, hand off push

**Files:** none

- [ ] **Step 1: Confirm a clean, complete branch**

Run: `git status --short && git log --oneline main..mobile-phone-hero`
Expected: clean tree; the log lists the spec + Task 2/3/6/7/8 commits.

- [ ] **Step 2: Ensure node_modules / Playwright didn't leak into git**

Run: `git status --ignored --short | grep -E "node_modules|playwright" || echo "clean"`
Expected: `node_modules` shows only as ignored (or nothing). If `package.json` gained Playwright, revert that one change (Playwright is a throwaway verification dep, not a project dep).

- [ ] **Step 3: Hand the merge/push to the user**

This environment blocks pushing to GitHub. Tell the user to run, via the `!` prefix:

```
!git -C /home/yurin/projects/luckyweb/LuckyWeb checkout main && git -C /home/yurin/projects/luckyweb/LuckyWeb merge --ff-only mobile-phone-hero && git -C /home/yurin/projects/luckyweb/LuckyWeb push origin main
```

Then offer to delete the `mobile-phone-hero` branch (local + remote) once the push lands.

---

## Self-review (against the spec)

- **Spec §1 video asset** → Tasks 4 (still), 5 (animate), 6 (encode webm/mp4 + poster). ✓
- **Spec §2 mobile hero wiring** → Task 7 (source/poster swap, mobile-only) + Task 8 (`object-position:center`). Reduced-motion portrait poster handled in Task 7 Step 1 (`poster.src` set before the `reduce` return). ✓
- **Spec §3 targeted fixes** → Task 2 (nav pill, language tap targets), Task 3 (headline clamp, section rhythm, hero-inner). ✓
- **Spec §4 verification** → Task 9 (390×844 + 360×640 screenshots, overflow check, npm test, desktop unchanged). ✓
- **Spec constraints** → zero-build/local-assets/no-deps preserved; Playwright/node_modules kept out of git (Task 10 Step 2); Higgsfield connectivity + balance gated in Task 1 Step 3 with a contingency. ✓
- **Filename consistency:** `hero-phone.webm` / `hero-phone.mp4` / `hero-phone-poster.webp` used identically in Tasks 6, 7. ✓
- **Placeholder scan:** the only intentional substitution is `<FINAL_VIDEO_URL>` in Task 6 Step 1 (a runtime value from Task 5, not a plan gap). No TBD/TODO/"handle edge cases." ✓
