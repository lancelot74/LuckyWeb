import { describe, it, expect } from 'vitest';
import { translate, applyTranslations, STRINGS, LANGS } from '../js/lib/i18n.js';

describe('translate', () => {
  it('returns the value for the given lang + key', () => {
    expect(translate(STRINGS, 'en', 'hero_sub')).toContain('design and build');
  });
  it('falls back to English for an unknown lang', () => {
    expect(translate(STRINGS, 'xx', 'hero_sub')).toBe(STRINGS.en.hero_sub);
  });
  it('returns empty string for an unknown key', () => {
    expect(translate(STRINGS, 'en', 'nope__')).toBe('');
  });
  it('exposes the four supported languages', () => {
    expect(LANGS).toEqual(['en', 'zh', 'mn', 'hy']);
  });
});

describe('applyTranslations', () => {
  it('sets textContent for plain keys and innerHTML for _html keys', () => {
    document.body.innerHTML =
      '<h1 data-t="hero_h1_html"></h1><p data-t="hero_sub"></p>';
    applyTranslations(document, STRINGS, 'en');
    expect(document.querySelector('h1').innerHTML).toContain('<em>');
    expect(document.querySelector('p').textContent).toContain('design and build');
  });
});
