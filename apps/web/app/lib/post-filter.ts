/**
 * Which scraped posts are worth importing, decided before the AI parser runs.
 *
 * Kept apart from `sync.ts` so it can be tested directly — importing that file
 * drags in Prisma, the scraper and the parser.
 */

export interface ScrapedPost {
  id: string;
  text: string;
  images: string[];
}

export interface PostSelection<T> {
  /** Posts to parse and import. Every other post is counted below. */
  toImport: T[];
  /** Nothing for the parser to read and nothing for a human to judge. */
  skippedNoText: number;
  /** Dropped by the require-images rule. */
  skippedNoImages: number;
  /** Already in the queue from an earlier sync. */
  skippedDuplicate: number;
}

/**
 * Filter, in order: has text → has an image → not already imported.
 *
 * The duplicate check used to happen *after* parsing, so the AI ran on every
 * scraped post on every sync and the result was discarded a few lines later.
 * With five posts per group, five groups and four syncs a day, nearly all of
 * that was re-parsing posts already sitting in the queue.
 *
 * Each post falls into exactly one bucket, so the counts always add up to the
 * input length — a run that imports nothing can say which rule dropped what.
 */
export function selectPosts<T extends ScrapedPost>(
  posts: readonly T[],
  opts: { alreadyImported: ReadonlySet<string>; requireImages: boolean }
): PostSelection<T> {
  const selection: PostSelection<T> = {
    toImport: [],
    skippedNoText: 0,
    skippedNoImages: 0,
    skippedDuplicate: 0
  };

  for (const post of posts) {
    if (!post.text || post.text.trim().length === 0) {
      selection.skippedNoText++;
    } else if (opts.requireImages && post.images.length === 0) {
      selection.skippedNoImages++;
    } else if (opts.alreadyImported.has(post.id)) {
      selection.skippedDuplicate++;
    } else {
      selection.toImport.push(post);
    }
  }

  return selection;
}

/**
 * Whether a post must carry at least one image to be imported.
 *
 * On by default. `SYNC_REQUIRE_IMAGES=false` turns it off without a deploy,
 * because this rule does discard real listings — a text-only "selling my sofa,
 * message me" is a genuine ad that will never reach the queue while it is on.
 */
export function requireImagesEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.SYNC_REQUIRE_IMAGES !== 'false';
}
