import { prisma } from './prisma';
import { decrypt } from './crypto';
import { PlaywrightScraperService } from '../../../api/src/scrapers/playwright-scraper.service';
import { OpenAIParserService } from '../../../api/src/parser/openai-parser.service';

export interface SyncResult {
  success: boolean;
  postsFound?: number;
  listingsImported?: number;
  needsFacebook?: boolean;
  error?: string;
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

  // Private groups need a Facebook session. Preference order:
  //   1. the owner's own connected session (primary model — spreads ban risk)
  //   2. the shared global FB_COOKIES as a transition fallback
  //   3. otherwise, prompt the owner to connect.
  // Public groups sync with no login at all.
  let cookiesJson: string | null = null;
  if (!group.isPublic) {
    if (group.user?.fbSessionStatus === 'ACTIVE' && group.user?.fbSessionCookies) {
      try {
        cookiesJson = decrypt(group.user.fbSessionCookies);
      } catch {
        return { success: false, needsFacebook: true, error: 'Stored Facebook session is unreadable. Please reconnect.' };
      }
    } else if (!process.env.FB_COOKIES) {
      // No per-owner session and no shared fallback available.
      return { success: false, needsFacebook: true, error: 'Connect your Facebook account to sync this private group.' };
    }
    // else: fall through with cookiesJson = null → the scraper uses the shared
    // FB_COOKIES fallback until this owner connects their own session.
  }

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
    // Auth/login-wall failure on a private group → mark the session expired and
    // prompt a reconnect instead of reporting a fake success.
    if (!group.isPublic && /FB_AUTH_REQUIRED|auth|login|session|cookie/i.test(msg)) {
      await prisma.user.update({
        where: { id: group.userId },
        data: { fbSessionStatus: 'EXPIRED' }
      });
      return { success: false, needsFacebook: true, error: 'Your Facebook session expired. Please reconnect Facebook and sync again.' };
    }
    return { success: false, error: msg };
  }

  let importedCount = 0;
  const { sendAdminModerationAlert } = require('./email');

  for (const post of rawPosts) {
    const parsed = await parser.parseRawPost(post.text);
    if (parsed.isListing) {
      importedCount++;
      const imported = await prisma.importedPost.upsert({
        where: { fbPostId: post.id },
        update: {
          rawText: post.text,
          images: post.images,
          authorName: post.author,
          priceScraped: parsed.price || null,
          status: 'PENDING'
        },
        create: {
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

      // Dispatch background email alert (non-blocking)
      sendAdminModerationAlert({
        id: imported.id,
        authorName: imported.authorName,
        rawText: imported.rawText,
        groupName: group.name
      }).catch((err: any) => console.error('Failed to trigger admin email notifier:', err));
    }
  }

  return { success: true, postsFound: rawPosts.length, listingsImported: importedCount };
}
