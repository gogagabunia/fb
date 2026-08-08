import { describe, it, expect } from 'vitest';
import { requireImagesEnabled, selectPosts, type ScrapedPost } from '../apps/web/app/lib/post-filter';

const post = (id: string, over: Partial<ScrapedPost> = {}): ScrapedPost => ({
  id,
  text: 'Selling a bike, $200',
  images: ['https://example.com/a.jpg'],
  ...over
});

const none = new Set<string>();

describe('selectPosts', () => {
  it('keeps a post with text and an image that has not been seen', () => {
    const { toImport } = selectPosts([post('1')], { alreadyImported: none, requireImages: true });
    expect(toImport.map(p => p.id)).toEqual(['1']);
  });

  it('drops posts already in the queue', () => {
    // The point of the change: these must never reach the parser. They used to
    // be filtered after it, so each one cost an AI call whose result was
    // discarded on the very next line.
    const result = selectPosts([post('1'), post('2')], {
      alreadyImported: new Set(['1']),
      requireImages: true
    });
    expect(result.toImport.map(p => p.id)).toEqual(['2']);
    expect(result.skippedDuplicate).toBe(1);
  });

  it('drops posts with no images', () => {
    const result = selectPosts([post('1', { images: [] })], {
      alreadyImported: none,
      requireImages: true
    });
    expect(result.toImport).toEqual([]);
    expect(result.skippedNoImages).toBe(1);
  });

  it('keeps image-less posts when the rule is off', () => {
    const result = selectPosts([post('1', { images: [] })], {
      alreadyImported: none,
      requireImages: false
    });
    expect(result.toImport.map(p => p.id)).toEqual(['1']);
    expect(result.skippedNoImages).toBe(0);
  });

  it('drops posts with no text either way', () => {
    for (const text of ['', '   ']) {
      const result = selectPosts([post('1', { text })], {
        alreadyImported: none,
        requireImages: false
      });
      expect(result.toImport, JSON.stringify(text)).toEqual([]);
      expect(result.skippedNoText, JSON.stringify(text)).toBe(1);
    }
  });

  it('counts every post exactly once', () => {
    // The counts are what a zero-import run reports for itself, so they have to
    // add up — otherwise "scraped 5, imported 0" still explains nothing.
    const posts = [
      post('keep'),
      post('dupe'),
      post('no-image', { images: [] }),
      post('no-text', { text: '' }),
      post('dupe-and-no-image', { images: [] })
    ];
    const r = selectPosts(posts, { alreadyImported: new Set(['dupe', 'dupe-and-no-image']), requireImages: true });

    expect(r.toImport.length + r.skippedNoText + r.skippedNoImages + r.skippedDuplicate).toBe(posts.length);
    expect(r.toImport.map(p => p.id)).toEqual(['keep']);
  });

  it('handles an empty scrape', () => {
    const r = selectPosts([], { alreadyImported: none, requireImages: true });
    expect(r).toEqual({ toImport: [], skippedNoText: 0, skippedNoImages: 0, skippedDuplicate: 0 });
  });
});

describe('requireImagesEnabled', () => {
  it('is on by default', () => {
    expect(requireImagesEnabled({} as NodeJS.ProcessEnv)).toBe(true);
  });

  it('is turned off only by the exact string "false"', () => {
    expect(requireImagesEnabled({ SYNC_REQUIRE_IMAGES: 'false' } as NodeJS.ProcessEnv)).toBe(false);
    // Anything else keeps the rule on rather than silently disabling it.
    for (const value of ['', '0', 'no', 'FALSE', 'true']) {
      expect(
        requireImagesEnabled({ SYNC_REQUIRE_IMAGES: value } as NodeJS.ProcessEnv),
        value
      ).toBe(true);
    }
  });
});
