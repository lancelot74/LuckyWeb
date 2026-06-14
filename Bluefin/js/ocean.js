/* ============================================================
   ocean.js — ambient deep-sea atmosphere
   Bioluminescent particles + drifting god-ray light shafts.
   Fixed full-viewport canvas behind all content (#ocean).
   ============================================================ */
(function () {
  'use strict';

  var canvas = document.getElementById('ocean');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
  var W = 0, H = 0;
  var particles = [];
  var shafts = [];
  var t = 0;
  var running = true;

  function size() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    build();
  }

  function rand(a, b) { return a + Math.random() * (b - a); }

  function build() {
    // particle count scales with area, capped for performance
    var count = Math.min(90, Math.round((W * H) / 22000));
    particles = [];
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: rand(0.6, 2.6),
        sp: rand(4, 16),          // upward drift px/s
        amp: rand(6, 26),         // horizontal sway
        ph: rand(0, Math.PI * 2),
        fr: rand(0.2, 0.7),       // sway frequency
        a: rand(0.15, 0.7)        // base alpha
      });
    }
    // a few slow light shafts
    shafts = [];
    var n = W < 700 ? 3 : 5;
    for (var j = 0; j < n; j++) {
      shafts.push({
        x: (j + 0.5) / n + rand(-0.06, 0.06),
        w: rand(0.05, 0.13),
        sp: rand(0.006, 0.016),
        ph: rand(0, Math.PI * 2),
        a: rand(0.04, 0.09)
      });
    }
  }

  function drawShafts() {
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < shafts.length; i++) {
      var s = shafts[i];
      var sway = Math.sin(t * s.sp * 6 + s.ph) * 0.04;
      var cx = (s.x + sway) * W;
      var top = cx - s.w * W * 0.5;
      var bottomShift = W * 0.12 * Math.sin(t * s.sp * 4 + s.ph);
      var g = ctx.createLinearGradient(cx, 0, cx + bottomShift, H);
      g.addColorStop(0, 'rgba(120,235,225,' + s.a + ')');
      g.addColorStop(0.55, 'rgba(56,160,170,' + (s.a * 0.4) + ')');
      g.addColorStop(1, 'rgba(10,42,63,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(top, 0);
      ctx.lineTo(top + s.w * W, 0);
      ctx.lineTo(cx + bottomShift + s.w * W * 1.6, H);
      ctx.lineTo(cx + bottomShift - s.w * W * 0.6, H);
      ctx.closePath();
      ctx.fill();
    }
  }

  function drawParticles(dt) {
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      p.y -= p.sp * dt;
      p.ph += p.fr * dt;
      if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
      var x = p.x + Math.sin(p.ph) * p.amp;
      var twinkle = 0.6 + 0.4 * Math.sin(p.ph * 1.7);
      var alpha = p.a * twinkle;
      var glow = p.r * 5;
      var g = ctx.createRadialGradient(x, p.y, 0, x, p.y, glow);
      g.addColorStop(0, 'rgba(180,250,245,' + alpha + ')');
      g.addColorStop(0.4, 'rgba(56,225,214,' + (alpha * 0.5) + ')');
      g.addColorStop(1, 'rgba(56,225,214,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, p.y, glow, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  var last = 0;
  function frame(now) {
    if (!running) return;
    var dt = last ? Math.min((now - last) / 1000, 0.05) : 0.016;
    last = now;
    t += dt;
    ctx.clearRect(0, 0, W, H);
    drawShafts();
    drawParticles(dt);
    requestAnimationFrame(frame);
  }

  function staticFrame() {
    ctx.clearRect(0, 0, W, H);
    drawShafts();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
      g.addColorStop(0, 'rgba(180,250,245,' + p.a + ')');
      g.addColorStop(1, 'rgba(56,225,214,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  // pause when tab hidden to save cycles
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { running = false; }
    else if (!reduce) { running = true; last = 0; requestAnimationFrame(frame); }
  });

  // pause while the hero fully covers the canvas (it's occluded — no point drawing)
  var heroEl = document.getElementById('surface');
  if (heroEl && 'IntersectionObserver' in window && !reduce) {
    new IntersectionObserver(function (es) {
      var covered = es[0].intersectionRatio > 0.55;
      if (covered) { running = false; }
      else if (!running && !document.hidden) { running = true; last = 0; requestAnimationFrame(frame); }
    }, { threshold: [0, 0.55, 1] }).observe(heroEl);
  }

  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () { size(); if (reduce) staticFrame(); }, 180);
  });

  size();
  if (reduce) staticFrame();
  else requestAnimationFrame(frame);
})();
