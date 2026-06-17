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

  if (reduce) { scrub.style.display = 'none'; poster.style.display = 'block'; return; } // static final frame
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
    pts = pts.map((p) => stepParticle(p, w, h));
    for (const p of pts) { ctx.globalAlpha = p.a; ctx.fillStyle = '#C7451B'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); }
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
  // Lock the hero (pin) and scrub the full build while it stays put, so the WHOLE laptop is on
  // screen for the entire animation, then release to the page. Content sits up top and the frame
  // is bottom-anchored, so nothing covers the laptop and neither base nor lid is cropped.
  window.ScrollTrigger.create({
    trigger: hero, start: 'top top', end: '+=220%', pin: true, scrub: 0.5,
    onUpdate: (self) => drawFrame(frameIndexForProgress(self.progress, count)),
  });
}
