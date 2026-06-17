// js/main.js
import { STRINGS, LANGS, applyTranslations } from './lib/i18n.js';
import { prefersReducedMotion } from './lib/env.js';
import { navigateWithTransition } from './lib/transitions.js';

const reduce = prefersReducedMotion(window);

function setLang(lang) {
  if (!LANGS.includes(lang)) lang = 'en';
  applyTranslations(document, STRINGS, lang);
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.classList.toggle('active', b.getAttribute('data-lang') === lang));
  try { localStorage.setItem('lw-lang', lang); } catch {}
}
window.setLang = setLang;

function initReveals() {
  const els = document.querySelectorAll('.r');
  if (reduce) { els.forEach((el) => el.classList.add('in')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.18 });
  els.forEach((el) => io.observe(el));
}

function initSmoothScroll() {
  if (reduce || !window.Lenis) return;
  const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
  if (window.ScrollTrigger) lenis.on('scroll', window.ScrollTrigger.update);
}

function initForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const note = document.getElementById('form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.checkValidity()) { note.textContent = 'Please fill every field.'; return; }
    const data = new FormData(form);
    const body = encodeURIComponent(`From: ${data.get('name')} <${data.get('email')}>\n\n${data.get('message')}`);
    window.location.href = `mailto:info@luckyweb.org?subject=New%20project%20enquiry&body=${body}`;
    note.textContent = 'Opening your email client…';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  let saved = 'en';
  try { saved = localStorage.getItem('lw-lang') || 'en'; } catch {}
  setLang(saved);
  document.querySelectorAll('[data-lang]').forEach((b) =>
    b.addEventListener('click', () => setLang(b.getAttribute('data-lang'))));
  initReveals();
  initSmoothScroll();
  initForm();
  document.querySelectorAll('a[href$=".html"], a.brand, a.work-all').forEach((a) => {
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || href.startsWith('http')) return;
    a.addEventListener('click', (e) => { e.preventDefault(); navigateWithTransition(href, { doc: document, loc: location }); });
  });
});
