import { describe, it, expect } from 'vitest';
import { frameIndexForProgress } from '../js/lib/scrub.js';

describe('frameIndexForProgress', () => {
  it('maps 0 → first frame', () => expect(frameIndexForProgress(0, 120)).toBe(0));
  it('maps 1 → last frame', () => expect(frameIndexForProgress(1, 120)).toBe(119));
  it('maps the midpoint to the middle', () => expect(frameIndexForProgress(0.5, 120)).toBe(60));
  it('clamps below 0', () => expect(frameIndexForProgress(-3, 120)).toBe(0));
  it('clamps above 1', () => expect(frameIndexForProgress(9, 120)).toBe(119));
  it('handles an empty sequence', () => expect(frameIndexForProgress(0.5, 0)).toBe(0));
});
