# Bluefin — "The Craft" Pinned Scroll-Story (Design)

- Date: 2026-06-14
- Status: Approved (brainstorm)
- Supersedes the Craft-section scroll-scrubbed `<video>` ("the cut").

## Goal

Replace the current scroll-scrubbed `<video>` in the Craft section with a **pinned,
image-sequence scroll-story** of the sushi-making process. Fix the two problems the
user reported with the current behavior:

1. **Choppy** scrubbing.
2. **Bad pacing** — progress reaches only ~70% by the time the frame is already
   leaving the viewport.

## Decisions (from brainstorm)

- **Presentation:** pinned scroll-story (`position: sticky`), synced to the four
  craft steps 巻 / 庖 / 切 / 盛.
- **Content:** "The Four Steps" — hands-on craft: FORM → BLADE → SLICE → PLATE.
  Chef's hands visible (real craft), matching the existing step kanji.
- **Technique:** image-sequence scrub drawn to a `<canvas>` — **no `<video>`
  seeking**. Chosen to permanently eliminate the video decode/seek/range bugs hit
  earlier (black box, choppiness) and to guarantee smooth, frame-exact, reversible
  scrubbing that behaves identically on Python `http.server` and GitHub Pages.
- **Step cards:** folded into a single synced overlay caption (no separate static
  row of `.step` cards).

## Footage (Higgsfield · Seedance 2.0 · 16:9 · ~5s · dark hinoki board, warm key light)

- **Reuse** existing `assets/video/sushi-cut.mp4` for the middle beats (庖 blade →
  切 slice) — already on-look and high quality.
- **Generate 2 new clips** (matched look so they cut together):
  - **FORM (巻):** a chef's hands pressing/shaping fresh bluefin over seasoned sushi
    rice, forming nigiri, macro, dark moody, warm light.
  - **PLATE (盛):** a chef's hand placing finished bluefin slices onto a dark ceramic
    plate with a single shiso garnish leaf, final beauty shot.
- **Stitch order:** FORM → CUT (existing) → PLATE ≈ 15s reel.
- **Estimated cost ≈ 45 credits** (2 × ~22.5). Preflight before generating.
  Fallback: regenerate all 4 beats for perfect continuity (~90 credits).

## Frame export

- `ffmpeg` concat the 3 clips (normalize fps + scale to 1280×720).
- Extract **~120 evenly-spaced frames** as **WebP** (q≈80), 16:9, to
  `Bluefin/assets/craft/frame-000.webp … frame-119.webp`.
- Target total payload **≤ ~6 MB**.
- Keep a `craft-poster.jpg` (final plated frame) for the reduced-motion / loading
  fallback.

## Scroll mechanics

- **DOM:** a `.craft-stage` wrapper (height ≈ 360vh) containing a
  `position:sticky; top:0` viewport-height pin that holds a `<canvas>` (16:9,
  max-width ≈ 960, centered) plus the overlay caption + progress bar.
- **Module:** `Bluefin/js/craft.js` (new, kept separate from `main.js`).
  - **Lazy preload** all frames (Image objects) when the wrapper is within ~1
    viewport of entering; show a small loading state until the first frame decodes.
  - On scroll (rAF): `p = clamp((scrollY - wrapperTop) / (wrapperHeight - vh), 0, 1)`.
  - **Ease:** lerp a displayed value toward `p` each frame
    (`cur += (p - cur) * 0.12`) so it glides; reverses naturally on scroll-up.
  - `frameIndex = round(eased * (N - 1))`; draw to canvas with cover math + DPR cap.
- **Pacing fix:** `p` reaches `1` exactly when the sticky region ends, so the last
  frame is shown while the canvas is still fully on screen — never "70% as it leaves."
- **Captions:** four step segments by progress thresholds tuned to the clip
  boundaries (≈ 0–0.33 巻 FORM, 0.33–0.5 庖 BLADE, 0.5–0.75 切 SLICE, 0.75–1 盛
  PLATE). Cross-fade kanji + title + one-line description. Thin biolum progress bar.
- **Reduced motion:** no pin/scrub — render the final plated frame statically and
  show the four step texts as a simple list.

## Integration / cleanup

- Replace the `.cut-stage` block in `index.html` Craft section with the new
  `.craft-stage` (wrapper → sticky pin → canvas + overlay).
- Remove the 4 static `.step` cards (folded into the overlay).
- Remove from `main.js`: `cutVideo` / `cutStage` / `initCut` logic and the `--cp`
  scrub block in `updateDepth()`.
- Remove from `styles.css`: `.cut-stage`, `.cut-hint`, `.steps`/`.step*` rules;
  add `.craft-stage`, canvas, caption, progress styles (dark + Adaline discipline).
- `sushi-cut.mp4` stays in `assets/` as a reel source but is no longer referenced by
  the page.
- Load `js/craft.js` from `index.html`.

## Success criteria

- Scrubbing is smooth and frame-exact, forward **and** reverse.
- The reel reaches its final frame while the canvas is still fully on screen.
- No black box; no reliance on `<video>` seeking; identical on `http.server` and
  GitHub Pages.
- `prefers-reduced-motion` shows a static final frame + step text.
- Added asset payload ≤ ~6 MB, lazy-loaded as the Craft section approaches.
