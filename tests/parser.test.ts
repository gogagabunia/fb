import { describe, it, expect } from 'vitest';
import {
  normalizeExtraction,
  LISTING_CATEGORIES,
  EXTRACTION_PROMPT
} from '../apps/api/src/parser/openai-parser.service';

/**
 * The parser's output used to reach the database through
 * `JSON.parse(text) as ExtractedListing`, an assertion that checks nothing at
 * runtime. These cover what actually goes wrong when a model answers loosely.
 */
describe('normalizeExtraction', () => {
  describe('price coercion', () => {
    it('accepts a plain number', () => {
      expect(normalizeExtraction({ isListing: true, price: 18500 }).price).toBe(18500);
    });

    it('coerces a formatted string, which would otherwise reach a Float column', () => {
      expect(normalizeExtraction({ isListing: true, price: '$18,500' }).price).toBe(18500);
      expect(normalizeExtraction({ isListing: true, price: '18500' }).price).toBe(18500);
      expect(normalizeExtraction({ isListing: true, price: '1 250.50' }).price).toBe(1250.5);
    });

    it('drops prices that are not numbers', () => {
      expect(normalizeExtraction({ isListing: true, price: 'free' }).price).toBeUndefined();
      expect(normalizeExtraction({ isListing: true, price: null }).price).toBeUndefined();
      expect(normalizeExtraction({ isListing: true, price: undefined }).price).toBeUndefined();
      expect(normalizeExtraction({ isListing: true, price: {} }).price).toBeUndefined();
    });

    it('rejects negative and non-finite prices', () => {
      expect(normalizeExtraction({ isListing: true, price: -5 }).price).toBeUndefined();
      expect(normalizeExtraction({ isListing: true, price: Infinity }).price).toBeUndefined();
      expect(normalizeExtraction({ isListing: true, price: NaN }).price).toBeUndefined();
    });

    it('keeps zero, which is a legitimate "free item" price', () => {
      expect(normalizeExtraction({ isListing: true, price: 0 }).price).toBe(0);
    });
  });

  describe('category whitelist', () => {
    it('accepts a known category regardless of case', () => {
      expect(normalizeExtraction({ isListing: true, category: 'vehicles' }).category).toBe('Vehicles');
      expect(normalizeExtraction({ isListing: true, category: 'Real Estate' }).category).toBe('Real Estate');
    });

    it('falls back to General for anything off-schema', () => {
      // "Cars" matches no marketplace filter, so it would be invisible.
      expect(normalizeExtraction({ isListing: true, category: 'Cars' }).category).toBe('General');
      expect(normalizeExtraction({ isListing: true, category: '' }).category).toBe('General');
      expect(normalizeExtraction({ isListing: true
      }).category).toBe('General');
    });

    it('only ever returns a category the prompt asked for', () => {
      const result = normalizeExtraction({ isListing: true, category: 'Nonsense' });
      expect(LISTING_CATEGORIES).toContain(result.category as any);
    });
  });

  describe('malformed and hostile input', () => {
    it.each([null, undefined, 'a string', 42, [], {}, { isListing: 'yes' }, { isListing: false }])(
      'returns isListing:false for %p rather than throwing',
      (input) => {
        expect(normalizeExtraction(input).isListing).toBe(false);
      }
    );

    it('resets a non-object specs to an empty object', () => {
      expect(normalizeExtraction({ isListing: true, specs: ['a'] }).specs).toEqual({});
      expect(normalizeExtraction({ isListing: true, specs: 'nope' }).specs).toEqual({});
      expect(normalizeExtraction({ isListing: true }).specs).toEqual({});
    });

    it('preserves a well-formed specs object', () => {
      const specs = { make: 'Honda', year: 2018 };
      expect(normalizeExtraction({ isListing: true, specs }).specs).toEqual(specs);
    });

    it('drops blank strings instead of storing whitespace', () => {
      const result = normalizeExtraction({ isListing: true, title: '   ', location: '' });
      expect(result.title).toBeUndefined();
      expect(result.location).toBeUndefined();
    });

    it('trims surrounding whitespace', () => {
      expect(normalizeExtraction({ isListing: true, title: '  Honda Accord  ' }).title).toBe('Honda Accord');
    });
  });
});

describe('EXTRACTION_PROMPT', () => {
  it('lists exactly the categories the validator accepts, so the two cannot drift', () => {
    for (const category of LISTING_CATEGORIES) {
      expect(EXTRACTION_PROMPT).toContain(`"${category}"`);
    }
  });

  it('tells the model how to signal a non-listing', () => {
    expect(EXTRACTION_PROMPT).toContain('"isListing": false');
  });
});
