import { describe, it, expect } from 'vitest';
import { prefersReducedMotion } from '../js/lib/env.js';

const fakeWin = (matches) => ({ matchMedia: () => ({ matches }) });

describe('prefersReducedMotion', () => {
  it('is true when the media query matches', () => {
    expect(prefersReducedMotion(fakeWin(true))).toBe(true);
  });
  it('is false when it does not match', () => {
    expect(prefersReducedMotion(fakeWin(false))).toBe(false);
  });
  it('is false when matchMedia is unavailable', () => {
    expect(prefersReducedMotion({})).toBe(false);
  });
});
