/* ============================================================
   craft.js — "The Craft" pinned scroll-story
   Image-sequence scrubbed on a <canvas>. No <video> seeking, so it is
   frame-exact, reverses perfectly, and behaves the same on any server.
   ============================================================ */
(function () {
  'use strict';

  var stage = document.getElementById('craftStage');
  var canvas = document.getElementById('craftCanvas');
  if (!stage || !canvas) return;

  var ctx = canvas.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var N = 120;                                  // frame count
  var BASE = 'assets/craft/frame-';             // assets/craft/frame-000.webp …
  var pad = function (i) { return ('00' + i).slice(-3); };

  var frames = new Array(N);
  var loaded = 0;
  var started = false;

  /* caption segments (folded-in step cards), keyed by scroll progress */
  var STEPS = [
    { from: 0.00, k: '握', s: 'Step 01 — The Form',  d: 'Seasoned rice pressed by hand into a perfect base for the marbled bluefin.' },
    { from: 0.34, k: '庖', s: 'Step 02 — The Knife', d: 'A single-edge yanagiba, honed to a mirror, readied over the piece.' },
    { from: 0.50, k: '切', s: 'Step 03 — The Cut',   d: 'One decisive pulling stroke reveals the vibrant heart of the fish.' },
    { from: 0.67, k: '盛', s: 'Step 04 — The Plate', d: 'Arranged with the care of ikebana — colour, height, spacing.' }
  ];
  var capEl = document.getElementById('craftCap');
  var kanjiEl = document.getElementById('capKanji');
  var stepEl = document.getElementById('capStep');
  var descEl = document.getElementById('capDesc');
  var barEl = document.getElementById('craftBar');
  var hintEl = document.getElementById('craftHint');

  /* ---- canvas sizing (DPR-capped) ---- */
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    drawFrame(currentIndex, true);
  }

  function drawCover(img) {
    var cw = canvas.width, ch = canvas.height;
    var ir = img.naturalWidth / img.naturalHeight, cr = cw / ch;
    var dw, dh, dx, dy;
    if (ir > cr) { dh = ch; dw = ch * ir; dx = (cw - dw) / 2; dy = 0; }
    else { dw = cw; dh = cw / ir; dx = 0; dy = (ch - dh) / 2; }
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  var currentIndex = -1;
  function ready(im) { return im && im.complete && im.naturalWidth; }

  function drawFrame(idx, force) {
    if (idx === currentIndex && !force) return;
    var im = frames[idx];
    if (!ready(im)) {                            // fall back to nearest decoded frame
      for (var r = 1; r < N; r++) {
        if (ready(frames[idx - r])) { im = frames[idx - r]; break; }
        if (ready(frames[idx + r])) { im = frames[idx + r]; break; }
      }
    }
    if (ready(im)) { drawCover(im); currentIndex = idx; }
  }

  /* ---- captions + progress ---- */
  var lastStep = -1;
  function setCaption(p) {
    if (!capEl) return;
    var i = 0;
    for (var s = 0; s < STEPS.length; s++) { if (p >= STEPS[s].from) i = s; }
    if (i === lastStep) return;
    lastStep = i;
    capEl.classList.add('swap');
    window.setTimeout(function () {
      kanjiEl.textContent = STEPS[i].k;
      stepEl.textContent = STEPS[i].s;
      descEl.textContent = STEPS[i].d;
      capEl.classList.remove('swap');
    }, 170);
  }

  function paint(p) {
    drawFrame(Math.round(p * (N - 1)));
    if (barEl) barEl.style.width = (p * 100).toFixed(2) + '%';
    setCaption(p);
    if (hintEl) hintEl.style.opacity = String(Math.max(0, 1 - p * 6));
  }

  /* ---- eased scroll loop ---- */
  var cur = 0, target = 0, running = false;
  function progress() {
    var span = stage.offsetHeight - window.innerHeight;
    if (span <= 0) return 0;
    // -rect.top is how far the stage's top has scrolled above the viewport top;
    // independent of any positioned ancestor (offsetTop would be relative to .band)
    return Math.min(Math.max(-stage.getBoundingClientRect().top / span, 0), 1);
  }
  function tick() {
    cur += (target - cur) * 0.14;
    if (Math.abs(target - cur) < 0.0008) cur = target;
    paint(cur);
    if (cur !== target) { requestAnimationFrame(tick); }
    else { running = false; }
  }
  function kick() { if (!running) { running = true; requestAnimationFrame(tick); } }
  function onScroll() { target = progress(); kick(); }

  /* ---- lazy preload as the section approaches ---- */
  function preload() {
    if (started) return;
    started = true;
    for (var i = 0; i < N; i++) {
      (function (i) {
        var im = new Image();
        im.onload = function () {
          loaded++;
          if (i === 0) { drawFrame(0, true); kick(); }
          if (loaded >= N) stage.classList.add('craft-ready');
        };
        im.onerror = function () { loaded++; };
        im.src = BASE + pad(i) + '.webp';
        frames[i] = im;
      })(i);
    }
  }

  window.addEventListener('resize', resize);

  if (reduce) {
    // No pin/scrub: show the final plated frame; the static step list (CSS) carries the text.
    var last = new Image();
    last.onload = function () { resize(); drawCover(last); };
    last.src = BASE + pad(N - 1) + '.webp';
    return;
  }

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { preload(); resize(); } });
    }, { rootMargin: '120% 0px' });
    io.observe(stage);
  } else {
    preload();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  resize();
  target = progress();
  kick();
})();
