// js/work-preview.js
import { indexOfMostVisible } from './lib/preview.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);
const cards = [...document.querySelectorAll('.card-media[data-loop]')];

// One <video> per card; preload nothing until it becomes the active (most-visible) clip.
const items = cards.map((media) => {
  const base = media.getAttribute('data-loop');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
  video.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
  // If the loop assets don't exist, the video errors and the static img stays visible.
  video.addEventListener('error', () => media.classList.remove('playing'), true);
  media.appendChild(video);
  return { media, video, ratio: 0 };
});

if (!reduce && items.length) {
  // Play only the single most-visible card; pause the rest so at most one clip decodes at a time.
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      const item = items.find((it) => it.media === e.target);
      if (item) item.ratio = e.intersectionRatio;
    }
    const active = indexOfMostVisible(items.map((it) => it.ratio), 0.5);
    items.forEach((it, i) => {
      if (i === active) {
        it.media.classList.add('playing');
        it.video.play().catch(() => it.media.classList.remove('playing'));
      } else {
        it.media.classList.remove('playing');
        it.video.pause();
      }
    });
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  items.forEach((it) => io.observe(it.media));
}
