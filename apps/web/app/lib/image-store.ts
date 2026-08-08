import { put } from '@vercel/blob';

/**
 * Persist scraped listing images into our own storage.
 *
 * Facebook's CDN URLs carry an expiry, so a listing that hotlinks them loses
 * its images some days after import — the marketplace slowly empties out and
 * falls back to placeholders. Copying the bytes at import time is the only way
 * a published listing keeps its photos.
 *
 * Degrades the same way the rest of this codebase does: with no
 * BLOB_READ_WRITE_TOKEN configured the original URLs are returned unchanged, so
 * development and unconfigured deployments still work — they just keep the old
 * expiring behaviour.
 */

/** Skip absurd downloads; scraped feed images are far smaller than this. */
const MAX_BYTES = 8 * 1024 * 1024;
/** Per-post cap, so one media-heavy post can't stall a sync. */
const MAX_IMAGES = 6;
// Kept tight: this runs per image, per post, inside a sync that has to finish
// well inside the cron's 60s. A CDN image that hasn't started in 8s isn't
// coming.
const FETCH_TIMEOUT_MS = 8_000;

let warnedMissingToken = false;

function isConfigured(): boolean {
  if (process.env.BLOB_READ_WRITE_TOKEN) return true;
  if (!warnedMissingToken) {
    warnedMissingToken = true;
    console.warn(
      '[image-store] BLOB_READ_WRITE_TOKEN is not set — listing images will keep pointing at ' +
        'Facebook CDN URLs, which expire. Set it to store images permanently.'
    );
  }
  return false;
}

export function extensionFor(contentType: string | null, url: string): string {
  const fromType = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif'
  }[(contentType || '').split(';')[0].trim().toLowerCase()];
  if (fromType) return fromType;

  const fromUrl = url.split('?')[0].match(/\.(jpe?g|png|webp|gif)$/i);
  return fromUrl ? fromUrl[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

/**
 * Copy one image into blob storage, returning its permanent URL.
 * Returns the original URL if anything goes wrong — a listing with an
 * expiring image is still better than a listing with none.
 */
async function persistOne(url: string, keyPrefix: string, index: number): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      console.warn(`[image-store] ${response.status} fetching ${url} — keeping original URL.`);
      return url;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.startsWith('image/')) {
      console.warn(`[image-store] ${url} is ${contentType}, not an image — keeping original URL.`);
      return url;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.byteLength === 0 || buffer.byteLength > MAX_BYTES) {
      console.warn(`[image-store] ${url} is ${buffer.byteLength} bytes — keeping original URL.`);
      return url;
    }

    const blob = await put(`${keyPrefix}/${index}.${extensionFor(contentType, url)}`, buffer, {
      access: 'public',
      contentType: contentType || 'image/jpeg',
      addRandomSuffix: true
    });

    return blob.url;
  } catch (error: any) {
    console.warn(`[image-store] Failed to store ${url}: ${error?.message || error} — keeping original URL.`);
    return url;
  }
}

/**
 * Copy scraped images into blob storage.
 *
 * @param urls      image URLs as scraped
 * @param keyPrefix storage path prefix, e.g. `posts/<postId>`
 */
export async function persistImages(urls: string[], keyPrefix: string): Promise<string[]> {
  if (!urls?.length || !isConfigured()) return urls || [];

  const capped = urls.slice(0, MAX_IMAGES);

  // Already-stored images survive a re-sync untouched.
  return Promise.all(
    capped.map((url, i) =>
      url.includes('.blob.vercel-storage.com') ? Promise.resolve(url) : persistOne(url, keyPrefix, i)
    )
  );
}
