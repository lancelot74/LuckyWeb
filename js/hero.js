// js/hero.js
import { frameIndexForProgress } from './lib/scrub.js';
import { particleCount } from './lib/particles.js';
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
  if (reduce) {
    // Static frame: the FINISHED/open laptop is the desirable still. The HTML ships the CLOSED frame
    // as the poster (so the pre-JS load state is never an open-frame flash), so swap to the open frame
    // here — unless this is a phone, where the branch above already set the portrait phone poster.
    if (!isMobile) poster.src = 'assets/hero/hero-poster.webp';
    scrub.style.display = 'none'; poster.style.display = 'block'; return;
  }
  if (isMobile || !window.gsap || !window.ScrollTrigger) {
    // Mobile / no-GSAP fallback: poster + looping video (no pinned scrub)
    scrub.style.display = 'none'; poster.style.display = 'none';
    video.loop = true; video.style.display = 'block';
    video.play().catch(() => { video.style.display = 'none'; poster.style.display = 'block'; });
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
  if (reduce) { draw(); return; } // single static frame
  // run the rAF loop only while the hero is on-screen (saves CPU/battery once scrolled past)
  let running = false, rafId;
  const tick = () => { if (!running) return; draw(); rafId = requestAnimationFrame(tick); };
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; tick(); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
  }, { threshold: 0 }).observe(canvas);
  function draw() {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#C7451B';
    // Move + wrap in place (mirrors stepParticle, inlined to avoid allocating a fresh array +
    // object for every particle on every frame — that GC churn is what made scrolling feel heavy).
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i];
      p.x += p.vx; if (p.x < 0) p.x = w; else if (p.x > w) p.x = 0;
      p.y += p.vy; if (p.y < 0) p.y = h; else if (p.y > h) p.y = 0;
      ctx.globalAlpha = p.a; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function initHeadline(hero) {
  const h1 = hero.querySelector('.hero-h1');
  if (!h1 || reduce || !window.gsap) return;
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
  const count = parseInt(hero.dataset.frames, 10) || 76;
  // HOLD: the closed laptop holds for the first slice of the locked scroll, so the visitor scrolls
  // down a bit and takes in the whole machine BEFORE the build begins — the lock engages, then the
  // animation "starts a bit lower". Frame 0 is the closed laptop; the build runs across the rest.
  const HOLD = 0.15;
  const ctx = canvas.getContext('2d');
  const frames = [];
  const decoded = new Array(count).fill(false); // per-frame "safe to draw without a sync decode" gate
  const pad = (i) => String(i).padStart(3, '0');
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.decoding = 'async'; // never block the main thread to decode
    img.src = `assets/hero/frame-${pad(i)}.webp`;
    const idx = i - 1;
    // Decode each frame fully (off the main thread) before we let drawFrame touch it. Until then
    // drawFrame falls back to the nearest already-decoded frame, so we never draw blank and never
    // force a multi-second synchronous decode inside drawImage while the user is scrolling.
    img.decode ? img.decode().then(mark, mark) : (img.onload = mark);
    function mark() { decoded[idx] = true; if (idx === 0) ready(); }
    frames.push(img);
  }

  // READINESS / Z-ORDER GATE: the CLOSED-laptop poster (frame-001, set in the HTML) is the static
  // load image. The poster comes AFTER the canvas in the DOM and shares z-index:0, so it PAINTS ON
  // TOP of the (initially blank) canvas and covers it during load. We retire the poster (display:none)
  // only inside ready() — the instant the canvas has drawn frame-001. Seamless: hero-poster-closed.webp
  // is byte-identical to frame-001.

  let st = null;
  // Pick the frame to draw, but never draw an undecoded one (would be blank or sync-decode-jank).
  // Walk down to the nearest lower frame that is decoded; that keeps the build monotonic while the
  // network catches up, instead of flashing blank or snapping forward to a frame that isn't ready.
  const safeIndex = (want) => { let i = want; while (i > 0 && !decoded[i]) i--; return decoded[i] ? i : -1; };
  // Map scroll progress → frame: hold the closed laptop for the first HOLD slice, then build.
  const render = (p) => {
    const mapped = p <= HOLD ? 0 : (p - HOLD) / (1 - HOLD);
    drawFrame(safeIndex(frameIndexForProgress(mapped, count)));
  };
  // Resizing the canvas (incl. ScrollTrigger's pin refresh) clears it, so repaint from LIVE progress
  // — never a stale index (ScrollTrigger sweeps progress to 1 during pin setup, which we must ignore).
  const fit = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; render(st ? st.progress : 0); };
  fit(); addEventListener('resize', fit);

  // The frame-001 decode callback (or the cached fast-path) is the ONLY thing that first paints the
  // canvas and retires the poster. It repaints from LIVE progress, not a hard-coded index, so a late
  // frame-001 decode can never "snap back to the start" over wherever the user has already scrolled.
  function ready() { render(st ? st.progress : 0); poster.style.display = 'none'; }

  function drawFrame(idx) {
    if (idx < 0) return; // nothing decoded yet — leave the current canvas contents alone
    const img = frames[idx]; if (!img.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    const scale = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    const dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
  }

  window.gsap.registerPlugin(window.ScrollTrigger);
  // Lock the hero (pin) so the WHOLE laptop stays on screen for the entire build, then release to
  // the page. The first HOLD slice keeps the closed laptop on screen (scroll down a bit first),
  // then the build scrubs to completion. Content sits up top and the frame is bottom-anchored, so
  // nothing covers the laptop and neither base nor lid is cropped.
  st = window.ScrollTrigger.create({
    trigger: hero, start: 'top top', end: '+=240%', pin: true, scrub: 0.3,
    onUpdate: (self) => render(self.progress),
  });
  render(st.progress); // resting state after setup, drawn from LIVE progress (not a forced index 0)
}
