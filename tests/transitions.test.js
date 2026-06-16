import { describe, it, expect, vi } from 'vitest';
import { supportsViewTransitions, navigateWithTransition } from '../js/lib/transitions.js';

describe('view transitions', () => {
  it('detects support', () => {
    expect(supportsViewTransitions({ startViewTransition: () => {} })).toBe(true);
    expect(supportsViewTransitions({})).toBe(false);
  });
  it('falls back to a plain navigation when unsupported', () => {
    const loc = { href: '' };
    navigateWithTransition('/work.html', { doc: {}, loc });
    expect(loc.href).toBe('/work.html');
  });
  it('wraps navigation in startViewTransition when supported', () => {
    const cb = vi.fn((fn) => fn());
    const loc = { href: '' };
    navigateWithTransition('/work.html', { doc: { startViewTransition: cb }, loc });
    expect(cb).toHaveBeenCalled();
    expect(loc.href).toBe('/work.html');
  });
});
