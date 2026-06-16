import { describe, it, expect } from 'vitest';
import { particleCount, stepParticle } from '../js/lib/particles.js';

describe('particleCount', () => {
  it('scales with area / density', () => expect(particleCount(1000, 550, 5500)).toBe(100));
  it('is 0 for zero-size canvases', () => expect(particleCount(0, 600)).toBe(0));
});

describe('stepParticle', () => {
  it('advances by velocity', () => {
    expect(stepParticle({ x: 10, y: 10, vx: 2, vy: -3 }, 100, 100)).toMatchObject({ x: 12, y: 7 });
  });
  it('wraps past the right/bottom edges', () => {
    const p = stepParticle({ x: 99, y: 99, vx: 5, vy: 5 }, 100, 100);
    expect(p.x).toBe(0); expect(p.y).toBe(0);
  });
  it('wraps past the left/top edges', () => {
    const p = stepParticle({ x: 1, y: 1, vx: -5, vy: -5 }, 100, 100);
    expect(p.x).toBe(100); expect(p.y).toBe(100);
  });
});
