// js/work-preview.js
import { shouldPlay } from './lib/preview.js';
import { prefersReducedMotion } from './lib/env.js';

const reduce = prefersReducedMotion(window);

document.querySelectorAll('.card-media[data-loop]').forEach((media) => {
  const base = media.getAttribute('data-loop');
  const video = document.createElement('video');
  video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
  video.innerHTML = `<source src="${base}.webm" type="video/webm"><source src="${base}.mp4" type="video/mp4">`;
  // If the loop assets don't exist, the video stays invisible and the static img shows.
  video.addEventListener('error', () => { media.classList.remove('playing'); }, true);
  media.appendChild(video);

  if (reduce) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (shouldPlay(e.intersectionRatio, 0.5)) {
        media.classList.add('playing');
        video.play().catch(() => media.classList.remove('playing'));
      } else { media.classList.remove('playing'); video.pause(); }
    });
  }, { threshold: [0, 0.5, 1] });
  io.observe(media);
});
