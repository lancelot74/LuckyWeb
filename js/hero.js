// js/hero.js
import { particleCount, stepParticle } from './lib/particles.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);
const hero = document.getElementById('hero');
if (hero) initHero(hero);

function initHero(hero) {
  initParticles(hero.querySelector('.hero-particles'));
  initHeadline(hero);
  initCountUp(hero);

  const scrub = hero.querySelector('.hero-scrub');
  const poster = hero.querySelector('.hero-poster');
  const video = hero.querySelector('.hero-video');
  scrub.style.display = 'none'; // scrub canvas retired in favour of an autoplay intro

  if (reduce) { poster.style.display = 'block'; return; } // static final (lit) frame

  // Play the transformation ONCE on load so the whole animation is visible up front,
  // then hold on the final finished-website frame. Falls back to the poster if autoplay is blocked.
  poster.style.display = 'none';
  video.loop = false;
  video.style.display = 'block';
  video.play().catch(() => { video.style.display = 'none'; poster.style.display = 'block'; });
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
