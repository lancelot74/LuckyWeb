import { describe, it, expect } from 'vitest';
import { shouldPlay, indexOfMostVisible } from '../js/lib/preview.js';

describe('shouldPlay', () => {
  it('plays at/above threshold', () => expect(shouldPlay(0.6, 0.5)).toBe(true));
  it('pauses below threshold', () => expect(shouldPlay(0.3, 0.5)).toBe(false));
});

describe('indexOfMostVisible', () => {
  it('returns -1 for empty', () => expect(indexOfMostVisible([], 0.5)).toBe(-1));
  it('returns -1 when all below min', () => expect(indexOfMostVisible([0.1, 0.4], 0.5)).toBe(-1));
  it('returns the only one at/above min', () => expect(indexOfMostVisible([0.2, 0.6, 0.1], 0.5)).toBe(1));
  it('returns the max when not first', () => expect(indexOfMostVisible([0.5, 0.9, 0.7], 0.5)).toBe(1));
  it('breaks ties to the first index', () => expect(indexOfMostVisible([0.8, 0.8], 0.5)).toBe(0));
  it('counts a ratio exactly at min', () => expect(indexOfMostVisible([0.5], 0.5)).toBe(0));
});
