/* ============================================================
   main.js — interaction & scroll behaviour
   ============================================================ */
(function () {
  'use strict';
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- nav ---- */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');

  function onScrollNav() {
    if (window.scrollY > 40) nav.classList.add('solid');
    else nav.classList.remove('solid');
  }

  if (burger) {
    burger.addEventListener('click', function () { menu.classList.toggle('open'); });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') menu.classList.remove('open');
    });
  }

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('in');
          countUp(en.target);
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); countUp(el); });
  }

  /* ---- animated counters ---- */
  function countUp(scope) {
    var nodes = scope.querySelectorAll ? scope.querySelectorAll('[data-count]') : [];
    nodes.forEach(function (node) {
      if (node.dataset.done) return;
      node.dataset.done = '1';
      var target = parseFloat(node.dataset.count);
      var dec = (node.dataset.count.indexOf('.') > -1) ? 1 : 0;
      if (reduce) { node.textContent = target.toFixed(dec); return; }
      var start = null, dur = 1400;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        node.textContent = (target * eased).toFixed(dec);
        if (p < 1) requestAnimationFrame(tick);
        else node.textContent = target.toFixed(dec);
      }
      requestAnimationFrame(tick);
    });
  }

  /* ---- depth meter + descent tint ---- */
  var meter = document.getElementById('depthMeter');
  var readout = document.getElementById('depthRead');
  var hero = document.getElementById('surface');
  var MAX_DEPTH = 920; // metres at page bottom
  var ticking = false;

  // craft cut video — scrubbed to scroll
  var cutVideo = document.getElementById('cutVideo');
  var cutStage = document.querySelector('.cut-stage');
  var cutReady = false;
  if (cutVideo) {
    cutVideo.addEventListener('loadedmetadata', function () { cutReady = true; updateDepth(); });
  }

  function updateDepth() {
    var max = doc.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    doc.style.setProperty('--depth', p.toFixed(3));
    if (readout) readout.textContent = Math.round(p * MAX_DEPTH);
    if (meter) {
      if (window.scrollY > window.innerHeight * 0.6) meter.classList.add('show');
      else meter.classList.remove('show');
    }
    // hero "dive" scrub — 0 at top, 1 once scrolled a full viewport; reverses on scroll up
    if (hero && !reduce) {
      var hh = hero.offsetHeight || window.innerHeight;
      var hp = Math.min(Math.max(window.scrollY / hh, 0), 1);
      doc.style.setProperty('--hp', hp.toFixed(3));
    }
    // craft cut — scrub video time to the stage's travel through the viewport; reverses on scroll up
    if (cutVideo && cutStage && cutReady && !reduce) {
      var r = cutStage.getBoundingClientRect();
      var vh = window.innerHeight;
      var cp = (vh - r.top) / (vh + r.height);
      cp = Math.min(Math.max(cp, 0), 1);
      doc.style.setProperty('--cp', cp.toFixed(3));
      var dur = cutVideo.duration;
      if (dur) {
        var tt = cp * (dur - 0.05);
        if (Math.abs(cutVideo.currentTime - tt) > 0.03) {
          try { cutVideo.currentTime = tt; } catch (e) {}
        }
      }
    }
    ticking = false;
  }

  function onScroll() {
    onScrollNav();
    if (!ticking) { requestAnimationFrame(updateDepth); ticking = true; }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', updateDepth);
  updateDepth();
  onScrollNav();

  /* ---- signature dish swapper ---- */
  var photo = document.getElementById('dishPhoto');
  var nameEl = document.getElementById('dishName');
  var jpEl = document.getElementById('dishJp');
  var descEl = document.getElementById('dishDesc');
  var tagsEl = document.getElementById('dishTags');
  var opts = document.querySelectorAll('.dish-opt');

  function selectDish(btn) {
    opts.forEach(function (o) { o.classList.remove('active'); });
    btn.classList.add('active');
    var d = btn.dataset;
    nameEl.textContent = d.name;
    jpEl.textContent = d.jp;
    descEl.textContent = d.desc;
    tagsEl.innerHTML = '';
    d.tags.split('|').forEach(function (tg) {
      var s = document.createElement('span');
      s.className = 'tag';
      s.textContent = tg;
      tagsEl.appendChild(s);
    });
    if (photo.getAttribute('src') === d.img) return;
    photo.classList.add('swapping');
    var swap = function () {
      photo.setAttribute('src', d.img);
      photo.setAttribute('alt', d.name);
      photo.classList.remove('swapping');
    };
    if (reduce) { swap(); }
    else { window.setTimeout(swap, 300); }
  }

  opts.forEach(function (btn) {
    btn.addEventListener('click', function () { selectDish(btn); });
  });
})();
