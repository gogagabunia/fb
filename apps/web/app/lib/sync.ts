import { prisma } from './prisma';
import { decrypt } from './crypto';
import { PlaywrightScraperService } from '../../../api/src/scrapers/playwright-scraper.service';
import { OpenAIParserService } from '../../../api/src/parser/openai-parser.service';

export interface SyncResult {
  success: boolean;
  postsFound?: number;
  listingsImported?: number;
  postsSkipped?: number;
  needsFacebook?: boolean;
  error?: string;
}

/** How many posts to run through the AI parser at once. */
const PARSE_CONCURRENCY = 5;

/**
 * Wall-clock budget for the parsing phase. The Vercel cron route caps out at
 * 60s, and parsing used to be a fully sequential await per post (up to 100),
 * which blew the budget and killed every group later in the cron's loop.
 */
const PARSE_BUDGET_MS = 35_000;

/** Run `worker` over `items` with a bounded number of concurrent calls. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Core "sync last 30 days of a group into PENDING imported posts" routine.
 * Shared by the authenticated Sync action and the cron job. Does NOT check a
 * user session — callers are responsible for authorization (the action checks
 * the logged-in owner; the cron checks CRON_SECRET). Not a server action, so it
 * is never exposed to the client directly.
 */
export async function syncGroupById(groupId: string): Promise<SyncResult> {
  const group = await prisma.facebookGroup.findUnique({
    where: { id: groupId },
    include: { user: true }
  });

  if (!group) {
    return { success: false, error: `Group with ID ${groupId} not found` };
  }

  // Cookie preference order (applies to BOTH public and private groups, because
  // the Apify actor needs a logged-in session to read ANY group):
  //   1. the owner's own connected session (their account is a member)
  //   2. the shared global FB_COOKIES fallback
  //   3. if neither exists and the group is private → prompt the owner to connect
  let cookiesJson: string | null = null;
  if (group.user?.fbSessionStatus === 'ACTIVE' && group.user?.fbSessionCookies) {
    try {
      cookiesJson = decrypt(group.user.fbSessionCookies);
    } catch {
      cookiesJson = null; // unreadable stored session → fall back to shared cookies
    }
  }
  if (!cookiesJson && !process.env.FB_COOKIES && !group.isPublic) {
    return { success: false, needsFacebook: true, error: 'Connect your Facebook account to sync this group.' };
  }
  // cookiesJson (owner) or, if null, the scraper falls back to shared FB_COOKIES.

  const scraper = new PlaywrightScraperService();
  const parser = new OpenAIParserService();

  // Test mode keeps Apify usage minimal during development: fetch only the
  // latest few posts with no date window. Toggle with SYNC_TEST_MODE=true;
  // unset (or "false") restores the full "last 30 days" sync.
  const testMode = process.env.SYNC_TEST_MODE === 'true';
  const sinceDays = testMode ? 0 : 30; // 0 → skip the 30-day date filter
  const maxPosts = testMode ? 5 : 100;

  let rawPosts;
  try {
    rawPosts = await scraper.scrapeGroup(group.id, { sinceDays, maxPosts, cookiesJson });
  } catch (scrapeErr: any) {
    const msg = String(scrapeErr?.message || scrapeErr);
    // Sync-based detection: a login-wall / access failure means the cookies we
    // had (the owner's or the shared fallback) can't read this group. Prompt the
    // owner to connect their own Facebook — regardless of the public/private
    // label, since even "public" groups need a login with this scraper.
    if (/FB_AUTH_REQUIRED|auth|login|session|cookie|access|denied|permission/i.test(msg)) {
      const hadOwnerSession = group.user?.fbSessionStatus === 'ACTIVE';
      if (hadOwnerSession) {
        await prisma.user.update({
          where: { id: group.userId },
          data: { fbSessionStatus: 'EXPIRED' }
        });
      }
      return {
        success: false,
        needsFacebook: true,
        error: hadOwnerSession
          ? 'Your Facebook session expired. Please reconnect Facebook and sync again.'
          : "Couldn't access this group. Connect a Facebook account that's a member of it, then sync again."
      };
    }
    return { success: false, error: msg };
  }

  const { sendAdminModerationAlert } = require('./email');

  // Skip empty / media-only posts — they can't be a classified listing and only
  // clutter the moderation queue.
  const candidates = rawPosts.filter(post => post.text && post.text.trim().length >= 10);

  const deadline = Date.now() + PARSE_BUDGET_MS;
  let skipped = 0;

  const parsedPosts = await mapWithConcurrency(candidates, PARSE_CONCURRENCY, async post => {
    if (Date.now() > deadline) {
      skipped++;
      return null;
    }
    try {
      const parsed = await parser.parseRawPost(post.text);
      return parsed.isListing ? { post, parsed } : null;
    } catch (parseErr: any) {
      console.error(`Failed to parse post ${post.id}:`, parseErr?.message || parseErr);
      return null;
    }
  });

  const listings = parsedPosts.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  let newCount = 0;

  for (const { post, parsed } of listings) {
    const existing = await prisma.importedPost.findUnique({
      where: { fbPostId: post.id },
      select: { id: true }
    });

    if (existing) {
      // Refresh the scraped content, but never touch `status`. This was an
      // upsert that always wrote status: 'PENDING', so every re-sync dragged
      // already-approved and already-rejected posts back into the moderation
      // queue — the same posts reappearing after each run.
      await prisma.importedPost.update({
        where: { id: existing.id },
        data: {
          rawText: post.text,
          images: post.images,
          authorName: post.author,
          priceScraped: parsed.price || null
        }
      });
      continue; // already seen — no second moderation alert
    }

    const imported = await prisma.importedPost.create({
      data: {
        fbPostId: post.id,
        rawText: post.text,
        images: post.images,
        authorName: post.author,
        priceScraped: parsed.price || null,
        status: 'PENDING',
        groupId: group.id,
        userId: group.userId
      }
    });
    newCount++;

    // Dispatch background email alert (non-blocking)
    sendAdminModerationAlert({
      id: imported.id,
      authorName: imported.authorName,
      rawText: imported.rawText,
      groupName: group.name
    }).catch((err: any) => console.error('Failed to trigger admin email notifier:', err));
  }

  if (skipped > 0) {
    console.warn(
      `[Sync] Parsing budget (${PARSE_BUDGET_MS}ms) exhausted for group "${group.name}" — ` +
        `${skipped} post(s) left unparsed. They will be retried on the next sync.`
    );
  }

  // Record the true import count against the log the scraper opened. Counts
  // only posts newly added to the queue — re-syncs of posts already seen are
  // not imports, and reporting them as such overstated every run.
  if (scraper.lastScrapingLogId) {
    await prisma.scrapingLog
      .update({
        where: { id: scraper.lastScrapingLogId },
        data: { postsImported: newCount }
      })
      .catch((err: any) => console.error('Failed to update scraping log import count:', err));
  }

  return {
    success: true,
    postsFound: rawPosts.length,
    listingsImported: newCount,
    postsSkipped: skipped
  };
}
