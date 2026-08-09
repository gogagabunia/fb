import { describe, it, expect } from 'vitest';
import { strings, getLang, t } from '../apps/web/app/lib/i18n';
import { CATEGORIES } from '../apps/web/app/lib/categories';

describe('the welcome-page dictionary', () => {
  it('has both languages for every key', () => {
    for (const [key, entry] of Object.entries(strings)) {
      expect(entry.ka, `${key}.ka`).toBeTruthy();
      expect(entry.en, `${key}.en`).toBeTruthy();
    }
  });

  it('Georgian strings actually contain Georgian script', () => {
    // Catches an English string pasted into the ka slot.
    for (const [key, entry] of Object.entries(strings)) {
      expect(entry.ka, `${key}.ka`).toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it('t() reads the right slot', () => {
    expect(t('sell', 'en')).toBe('Sell');
    expect(t('sell', 'ka')).toBe('გაყიდე');
  });
});

describe('getLang', () => {
  it('defaults to Georgian', () => {
    expect(getLang(undefined)).toBe('ka');
    expect(getLang('')).toBe('ka');
  });

  it('accepts en', () => {
    expect(getLang('en')).toBe('en');
  });

  it('falls back to Georgian on tampered cookies', () => {
    for (const junk of ['fr', 'EN', 'ka; path=/', '<script>']) {
      expect(getLang(junk), junk).toBe('ka');
    }
  });
});

describe('category translations', () => {
  it('every category has a Georgian name', () => {
    for (const category of CATEGORIES) {
      expect(category.nameKa, category.slug).toMatch(/[Ⴀ-ჿ]/);
    }
  });

  it('Georgian names are unique', () => {
    const names = CATEGORIES.map(c => c.nameKa);
    expect(new Set(names).size).toBe(CATEGORIES.length);
  });
});
