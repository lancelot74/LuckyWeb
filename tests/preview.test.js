import { describe, it, expect } from 'vitest';
import { shouldPlay } from '../js/lib/preview.js';

describe('shouldPlay', () => {
  it('plays at/above threshold', () => expect(shouldPlay(0.6, 0.5)).toBe(true));
  it('pauses below threshold', () => expect(shouldPlay(0.3, 0.5)).toBe(false));
});
