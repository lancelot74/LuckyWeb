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
  if (reduce) { scrub.style.display = 'none'; poster.style.display = 'block'; return; } // static frame
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
  const count = parseInt(hero.dataset.frames, 10) || 120;
  // HOLD: the closed laptop holds for the first slice of the locked scroll, so the visitor scrolls
  // down a bit and takes in the whole machine BEFORE the build begins — the lock engages, then the
  // animation "starts a bit lower". Frame 0 is the closed laptop; the build runs across the rest.
  const HOLD = 0.15;
  const ctx = canvas.getContext('2d');
  const frames = [];
  const pad = (i) => String(i).padStart(3, '0');
  for (let i = 1; i <= count; i++) {
    const img = new Image();
    img.decoding = 'async'; // decode off the main thread so the 121-frame preload doesn't jank load
    img.src = `assets/hero/frame-${pad(i)}.webp`;
    if (i === 1) img.onload = () => drawFrame(0); // closed laptop paints the moment it arrives
    frames.push(img);
  }
  let st = null;
  // Map scroll progress → frame: hold the closed laptop for the first HOLD slice, then build.
  const render = (p) => {
    const mapped = p <= HOLD ? 0 : (p - HOLD) / (1 - HOLD);
    drawFrame(frameIndexForProgress(mapped, count));
  };
  // Resizing the canvas (incl. ScrollTrigger's pin refresh) clears it, so repaint from LIVE progress
  // — never a stale index (ScrollTrigger sweeps progress to 1 during pin setup, which we must ignore).
  const fit = () => { canvas.width = hero.offsetWidth; canvas.height = hero.offsetHeight; render(st ? st.progress : 0); };
  fit(); addEventListener('resize', fit);
  poster.style.display = 'none';
  if (frames[0].complete && frames[0].naturalWidth) render(0); // already cached → paint closed laptop

  function drawFrame(idx) {
    const img = frames[idx]; if (!img || !img.complete || !img.naturalWidth) return;
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
  render(0); // resting state after setup: closed laptop, regardless of the setup progress sweep
}
