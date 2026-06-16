export function prefersReducedMotion(win = globalThis) {
  return !!(win.matchMedia && win.matchMedia('(prefers-reduced-motion: reduce)').matches);
}
