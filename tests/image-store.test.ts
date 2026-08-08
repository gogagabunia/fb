import { describe, it, expect, vi, afterEach } from 'vitest';
import { extensionFor, persistImages } from '../apps/web/app/lib/image-store';

afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
  vi.restoreAllMocks();
});

describe('extensionFor', () => {
  it('prefers the content type', () => {
    expect(extensionFor('image/png', 'https://cdn.test/x')).toBe('png');
    expect(extensionFor('image/webp', 'https://cdn.test/x')).toBe('webp');
    expect(extensionFor('image/jpeg', 'https://cdn.test/x')).toBe('jpg');
  });

  it('tolerates charset parameters and casing', () => {
    expect(extensionFor('IMAGE/PNG; charset=binary', 'https://cdn.test/x')).toBe('png');
  });

  it('falls back to the URL when the content type is absent or unknown', () => {
    expect(extensionFor(null, 'https://cdn.test/photo.PNG')).toBe('png');
    expect(extensionFor('application/octet-stream', 'https://cdn.test/photo.webp')).toBe('webp');
  });

  it('ignores the query string, which Facebook URLs are full of', () => {
    expect(extensionFor(null, 'https://scontent.fbcdn.net/v/t39/photo.jpg?_nc_cat=1&oh=abc')).toBe('jpg');
  });

  it('defaults to jpg when nothing identifies the format', () => {
    expect(extensionFor(null, 'https://scontent.fbcdn.net/v/t39/12345_n')).toBe('jpg');
  });
});

describe('persistImages', () => {
  it('returns the input untouched when storage is not configured', async () => {
    const urls = ['https://scontent.fbcdn.net/a.jpg', 'https://scontent.fbcdn.net/b.jpg'];
    // No BLOB_READ_WRITE_TOKEN: the app must keep working, just without
    // permanent copies.
    expect(await persistImages(urls, 'posts/x')).toEqual(urls);
  });

  it('handles empty and missing input', async () => {
    expect(await persistImages([], 'posts/x')).toEqual([]);
    expect(await persistImages(undefined as any, 'posts/x')).toEqual([]);
  });

  it('keeps the original URL when the download fails', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    const urls = ['https://scontent.fbcdn.net/gone.jpg'];
    // A listing with an expiring image still beats a listing with none.
    expect(await persistImages(urls, 'posts/x')).toEqual(urls);
  });

  it('keeps the original URL when the response is not an image', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        headers: { get: () => 'text/html' },
        arrayBuffer: async () => new ArrayBuffer(10)
      })
    );

    const urls = ['https://scontent.fbcdn.net/login.html'];
    expect(await persistImages(urls, 'posts/x')).toEqual(urls);
  });

  it('does not re-download images that are already stored', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    const stored = ['https://abc123.public.blob.vercel-storage.com/posts/x/0.jpg'];
    expect(await persistImages(stored, 'posts/x')).toEqual(stored);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('caps how many images one post can pull down', async () => {
    process.env.BLOB_READ_WRITE_TOKEN = 'test-token';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

    const many = Array.from({ length: 20 }, (_, i) => `https://scontent.fbcdn.net/${i}.jpg`);
    expect((await persistImages(many, 'posts/x')).length).toBeLessThanOrEqual(6);
  });
});
