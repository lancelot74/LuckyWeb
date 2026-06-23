/* ===== China — interactions ===== */
(function () {
  'use strict';

  /* ---------- Mobile nav ---------- */
  var hamburger = document.getElementById('hamburger');
  var nav = document.getElementById('nav');
  if (hamburger && nav) {
    hamburger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        nav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Hero thumbnail swap ---------- */
  var heroBg = document.getElementById('heroBg');
  var heroThumbs = document.getElementById('heroThumbs');
  if (heroBg && heroThumbs) {
    heroThumbs.querySelectorAll('.hthumb').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-hero');
        if (!src) return;
        heroBg.src = src;
        heroThumbs.querySelectorAll('.hthumb').forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = document.getElementById('lightbox');
  var lbImg = document.getElementById('lbImg');
  var lbCaption = document.getElementById('lbCaption');
  var figures = Array.prototype.slice.call(document.querySelectorAll('.ph'));
  var lbIndex = 0;

  function showSlide(i) {
    var n = figures.length;
    lbIndex = (i + n) % n;
    var fig = figures[lbIndex];
    var img = fig.querySelector('img');
    lbImg.src = img.getAttribute('src');
    lbImg.alt = img.getAttribute('alt') || '';
    lbCaption.textContent = fig.getAttribute('data-caption') || '';
  }

  function openLightbox(i) {
    showSlide(i);
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  figures.forEach(function (fig, i) {
    fig.addEventListener('click', function () { openLightbox(i); });
  });

  document.getElementById('lbClose').addEventListener('click', closeLightbox);
  document.getElementById('lbPrev').addEventListener('click', function () { showSlide(lbIndex - 1); });
  document.getElementById('lbNext').addEventListener('click', function () { showSlide(lbIndex + 1); });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowLeft') showSlide(lbIndex - 1);
    else if (e.key === 'ArrowRight') showSlide(lbIndex + 1);
  });
})();
