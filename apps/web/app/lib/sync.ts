import { prisma } from './prisma';
import { decrypt } from './crypto';
import { persistImages } from './image-store';
import { mapWithConcurrency } from './concurrency';
import { PlaywrightScraperService, type ApifyRunReport } from '../../../api/src/scrapers/playwright-scraper.service';
import { OpenAIParserService, type ExtractedListing } from '../../../api/src/parser/openai-parser.service';
import { emptyScrapeHint } from './sync-diagnostics';
import { requireImagesEnabled, selectPosts } from './post-filter';
import { can } from './authz';

export interface SyncResult {
  success: boolean;
  postsFound?: number;
  listingsImported?: number;
  postsSkipped?: number;
  /** Already in the queue from an earlier sync — not parsed, not re-imported. */
  postsDuplicate?: number;
  /** Dropped by the require-images rule, before parsing. */
  postsWithoutImages?: number;
  needsFacebook?: boolean;
  error?: string;

  /**
   * Why a sync returned what it did.
   *
   * A run reporting `success: true, postsFound: 0` used to be unanswerable: the
   * session used, the URL scraped and Apify's raw reply were all discarded, so
   * an empty result looked identical whether the session was missing, the
   * account wasn't a member, or the URL was wrong.
   */
  diagnostics?: {
    /** Which Facebook session was sent, if any. */
    usedSession: 'owner' | 'shared' | 'none';
    /** The URL actually handed to the scraper — catches badly saved groups. */
    groupUrl: string;
    /** Rows the scraper returned, before any filtering. */
    postsReturnedByScraper: number;
    /**
     * What Apify itself reported: run id, final status, raw dataset size, and —
     * when it produced nothing — the tail of the actor's own log. Absent when
     * the run never started or the browser fallback was used.
     */
    apify?: ApifyRunReport;
    /** Plain-language reading of the above, for whoever sees the telemetry. */
    hint?: string;
  };
}

/** How many posts to run through the AI parser at once. */
const PARSE_CONCURRENCY = 5;

/**
 * Wall-clock budget for the parsing phase, used when the caller gives no
 * deadline of its own (e.g. the interactive Sync button).
 *
 * A budget on parsing alone is not enough: it starts only once the scrape has
 * returned, and neither the scrape nor the image downloads were bounded. The
 * cron route hit FUNCTION_INVOCATION_TIMEOUT (504) at 60s because of exactly
 * that. Callers that have a hard limit should pass an absolute `deadline`, and
 * every phase below then works back from it.
 */
const PARSE_BUDGET_MS = 35_000;

/** Leave room to still write results and return a response before the cutoff. */
const WRAP_UP_RESERVE_MS = 5_000;


/**
 * Core "sync the most recent posts of a group into the PENDING queue" routine.
 * Shared by the authenticated Sync action and the cron job. Does NOT check a
 * user session — callers are responsible for authorization (the action checks
 * the logged-in owner; the cron checks CRON_SECRET). Not a server action, so it
 * is never exposed to the client directly.
 */
export async function syncGroupById(
  groupId: string,
  opts: { deadline?: number } = {}
): Promise<SyncResult> {
  // Absolute cutoff (epoch ms) for the whole sync, not just one phase.
  const deadline = opts.deadline ?? Date.now() + PARSE_BUDGET_MS * 2;
  const timeLeft = () => deadline - Date.now();
  const group = await prisma.facebookGroup.findUnique({
    where: { id: groupId },
    include: { user: true }
  });

  if (!group) {
    return { success: false, error: `Group with ID ${groupId} not found` };
  }

  // The owner must be allowed to sell. The cron filters this in its query;
  // this covers the interactive path and anything else that reaches here, so
  // a demoted seller's groups stop syncing everywhere at once.
  if (!can(group.user?.role, 'sell')) {
    return {
      success: false,
      error: 'This group\'s owner is not a seller, so it does not sync.'
    };
  }

  // Cookie preference order (applies to BOTH public and private groups, because
  // the Apify actor needs a logged-in session to read ANY group):
  //   1. the owner's own connected session (their account is a member)
  //   2. the shared global FB_COOKIES fallback
  //   3. if neither exists → prompt the owner to connect
  let cookiesJson: string | null = null;
  if (group.user?.fbSessionStatus === 'ACTIVE' && group.user?.fbSessionCookies) {
    try {
      cookiesJson = decrypt(group.user.fbSessionCookies);
    } catch {
      cookiesJson = null; // unreadable stored session → fall back to shared cookies
    }
  }

  const usedSession: 'owner' | 'shared' | 'none' =
    cookiesJson ? 'owner' : process.env.FB_COOKIES ? 'shared' : 'none';

  // This check used to end in `&& !group.isPublic`, so a group marked public
  // with no session went to the scraper anyway, came back with nothing, and was
  // reported as a success with zero posts. The comment above always said the
  // actor needs a session for ANY group; now the code agrees with it, and the
  // owner gets told to connect instead of seeing a silent empty run.
  if (usedSession === 'none') {
    return {
      success: false,
      needsFacebook: true,
      error: 'Connect your Facebook account to sync this group.',
      diagnostics: {
        usedSession: 'none',
        groupUrl: group.url,
        postsReturnedByScraper: 0,
        hint: 'No Facebook session is attached. The scraper cannot read any group without one, public or private.'
      }
    };
  }

  const scraper = new PlaywrightScraperService();
  const parser = new OpenAIParserService();

  // Take the most recent posts and let the operator decide, rather than
  // second-guessing which ones count. Both are env-tunable so raising the reach
  // later needs no deploy.
  const maxPosts = Number(process.env.SYNC_MAX_POSTS) || 5;
  const sinceDays = Number(process.env.SYNC_SINCE_DAYS) || 0; // 0 → no date window

  let rawPosts;
  try {
    rawPosts = await scraper.scrapeGroup(group.id, {
      sinceDays,
      maxPosts,
      cookiesJson,
      timeoutMs: Math.max(5_000, timeLeft() - WRAP_UP_RESERVE_MS)
    });
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
          : "Couldn't access this group. Connect a Facebook account that's a member of it, then sync again.",
        diagnostics: {
          usedSession,
          groupUrl: group.url,
          postsReturnedByScraper: 0,
          apify: scraper.lastApifyRun ?? undefined,
          hint: hadOwnerSession
            ? 'The stored session was rejected — it has expired or was invalidated by Facebook.'
            : 'The shared session cannot read this group. It is probably not a member.'
        }
      };
    }
    return {
      success: false,
      error: msg,
      diagnostics: {
        usedSession,
        groupUrl: group.url,
        postsReturnedByScraper: 0,
        apify: scraper.lastApifyRun ?? undefined
      }
    };
  }

  const { sendAdminModerationAlert } = require('./email');

  // Which posts are already in the queue. One query for the whole batch, run
  // *before* parsing: the duplicate check used to sit after it, so the AI was
  // called on every scraped post on every sync and the answer was thrown away
  // a few lines later.
  const alreadyImported = new Set<string>(
    rawPosts.length === 0
      ? []
      : (
          await prisma.importedPost.findMany({
            where: { fbPostId: { in: rawPosts.map(post => post.id) } },
            select: { fbPostId: true }
          })
        ).map(row => row.fbPostId)
  );

  const selection = selectPosts(rawPosts, {
    alreadyImported,
    requireImages: requireImagesEnabled()
  });
  const candidates = selection.toImport;

  if (selection.skippedNoImages > 0 || selection.skippedDuplicate > 0) {
    console.log(
      `[Sync] "${group.name}": ${rawPosts.length} scraped, ${candidates.length} new — ` +
        `${selection.skippedDuplicate} already imported, ${selection.skippedNoImages} without images, ` +
        `${selection.skippedNoText} without text.`
    );
  }

  const parseDeadline = Math.min(Date.now() + PARSE_BUDGET_MS, deadline - WRAP_UP_RESERVE_MS);
  let skipped = 0;

  const parsedPosts = await mapWithConcurrency(candidates, PARSE_CONCURRENCY, async post => {
    if (Date.now() > parseDeadline) {
      skipped++;
      return null;
    }
    try {
      // The parser's output prefills the moderation form; it no longer decides
      // whether the post is imported at all. Gating on isListing meant a
      // misjudged post was silently discarded and the operator never saw it —
      // which is exactly what the moderation queue exists to prevent.
      const parsed = await parser.parseRawPost(post.text);
      return { post, parsed };
    } catch (parseErr: any) {
      // A parse failure must not lose the post either — import it unparsed.
      console.error(`Failed to parse post ${post.id}:`, parseErr?.message || parseErr);
      return { post, parsed: { isListing: false } as ExtractedListing };
    }
  });

  const listings = parsedPosts.filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  let newCount = 0;
  let unimported = 0;
  let duplicates = selection.skippedDuplicate;

  for (const { post, parsed } of listings) {
    // Importing copies images into blob storage, which is another network round
    // trip per post. Stop before the cutoff rather than being killed mid-write;
    // whatever is left is picked up by the next run, since fbPostId dedupes.
    if (Date.now() > deadline - WRAP_UP_RESERVE_MS) {
      unimported++;
      continue;
    }

    // Storage key derived from the post identity so a re-sync lands in the same
    // place. The id can be a full permalink, so strip it to path-safe chars.
    const imageKey = `posts/${group.id}/${post.id.replace(/[^a-zA-Z0-9]+/g, '-').slice(-64)}`;

    // Everything here is new — duplicates were filtered out before parsing.
    // A concurrent sync of the same group can still land the same post first,
    // so the unique constraint on fbPostId is the real guard; treat that as the
    // duplicate it is rather than failing the whole group.
    let imported;
    try {
      imported = await prisma.importedPost.create({
        data: {
          fbPostId: post.id,
          rawText: post.text,
          images: await persistImages(post.images, imageKey),
          authorName: post.author,
          priceScraped: parsed.price || null,
          parsedCategory: parsed.category || null,
          status: 'PENDING',
          groupId: group.id,
          userId: group.userId
        }
      });
    } catch (createErr: any) {
      if (createErr?.code === 'P2002') {
        duplicates++;
        continue;
      }
      throw createErr;
    }
    newCount++;

    // Dispatch background email alert (non-blocking)
    sendAdminModerationAlert({
      id: imported.id,
      authorName: imported.authorName,
      rawText: imported.rawText,
      groupName: group.name
    }).catch((err: any) => console.error('Failed to trigger admin email notifier:', err));
  }

  if (skipped > 0 || unimported > 0) {
    console.warn(
      `[Sync] Time budget exhausted for group "${group.name}" — ` +
        `${skipped} post(s) left unparsed, ${unimported} parsed but not imported. ` +
        `Both are retried on the next sync.`
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

  // An empty scrape is reported as such rather than as a quiet success. The run
  // that prompted all this said `success: true, postsFound: 0` and gave no clue
  // which of three quite different causes it was.
  const hint =
    rawPosts.length === 0
      ? emptyScrapeHint({ usedSession, usedProxy: scraper.lastApifyRun?.usedProxy })
      : undefined;

  if (hint) console.warn(`[Sync] "${group.name}": ${hint} (url: ${group.url}, session: ${usedSession})`);

  return {
    success: true,
    postsFound: rawPosts.length,
    listingsImported: newCount,
    postsSkipped: skipped + unimported,
    postsDuplicate: duplicates,
    postsWithoutImages: selection.skippedNoImages,
    diagnostics: {
      usedSession,
      groupUrl: group.url,
      postsReturnedByScraper: rawPosts.length,
      apify: scraper.lastApifyRun ?? undefined,
      hint
    }
  };
}
