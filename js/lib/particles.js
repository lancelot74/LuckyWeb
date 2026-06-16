export function particleCount(width, height, density = 5500) {
  if (width <= 0 || height <= 0) return 0;
  return Math.max(0, Math.round((width * height) / density));
}

export function stepParticle(p, width, height) {
  let x = p.x + p.vx;
  let y = p.y + p.vy;
  if (x < 0) x = width; else if (x > width) x = 0;
  if (y < 0) y = height; else if (y > height) y = 0;
  return { ...p, x, y };
}
