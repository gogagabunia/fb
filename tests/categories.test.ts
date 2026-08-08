import { describe, it, expect } from 'vitest';
import {
  CATEGORIES,
  FALLBACK_CATEGORY,
  categoryBySlug,
  isValidCategorySlug,
  matchCategoryGuess,
} from '../apps/web/app/lib/categories';

describe('the fixed category list', () => {
  it('has unique slugs and names', () => {
    const slugs = CATEGORIES.map(c => c.slug);
    const names = CATEGORIES.map(c => c.name);
    expect(new Set(slugs).size).toBe(CATEGORIES.length);
    expect(new Set(names).size).toBe(CATEGORIES.length);
  });

  it('uses URL-safe slugs', () => {
    for (const { slug } of CATEGORIES) {
      expect(slug, slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('ends in the Other fallback', () => {
    expect(FALLBACK_CATEGORY.slug).toBe('other');
    expect(isValidCategorySlug('other')).toBe(true);
  });
});

describe('slug validation', () => {
  it('accepts every listed slug', () => {
    for (const { slug } of CATEGORIES) {
      expect(isValidCategorySlug(slug), slug).toBe(true);
    }
  });

  it('rejects free text — the reason the list is fixed', () => {
    // Approval used to accept anything typed, which is how "car", "Cars" and
    // "vehicle" would become three different categories.
    for (const junk of ['car', 'Cars', 'vehicle!', 'Vehicles', '', 'drop table']) {
      expect(isValidCategorySlug(junk), junk).toBe(false);
    }
  });

  it('looks up definitions by slug', () => {
    expect(categoryBySlug('vehicles')?.name).toBe('Vehicles');
    expect(categoryBySlug('nope')).toBeUndefined();
  });
});

describe('matching the AI parser guess', () => {
  it('matches exact names case-insensitively', () => {
    expect(matchCategoryGuess('vehicles').slug).toBe('vehicles');
    expect(matchCategoryGuess('Game Consoles').slug).toBe('game-consoles');
  });

  it('matches the loose phrasings the model actually produces', () => {
    expect(matchCategoryGuess('car').slug).toBe('vehicles');
    expect(matchCategoryGuess('Cars & Vehicles').slug).toBe('vehicles');
    expect(matchCategoryGuess('mobile phone').slug).toBe('phones');
    expect(matchCategoryGuess('laptop').slug).toBe('computers');
    expect(matchCategoryGuess('bike').slug).toBe('bicycles');
    expect(matchCategoryGuess('furniture').slug).toBe('home-furniture');
  });

  it('falls back to Other instead of failing', () => {
    // A miss pre-selects Other in the dropdown; the seller corrects by hand.
    for (const guess of [null, undefined, '', '   ', 'quantum flux capacitors']) {
      expect(matchCategoryGuess(guess).slug, String(guess)).toBe('other');
    }
  });
});
