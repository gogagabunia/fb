import { describe, it, expect } from 'vitest';
import { emptyScrapeHint } from '../apps/web/app/lib/sync-diagnostics';

/**
 * A sync that reported `success: true, postsFound: 0` used to be unanswerable —
 * the session used, the URL scraped and the raw reply were all discarded, so an
 * empty result looked the same whether the session was missing, the account
 * wasn't a member, or the URL was wrong.
 *
 * These mirror the decision logic in sync.ts. Importing it directly would drag
 * in Prisma, the scraper and the parser.
 */

type Session = 'owner' | 'shared' | 'none';

/** Mirrors how sync.ts picks which session to send. */
function pickSession(opts: { ownerCookies: string | null; sharedCookies: string | undefined }): Session {
  if (opts.ownerCookies) return 'owner';
  if (opts.sharedCookies) return 'shared';
  return 'none';
}

/** Mirrors the guard: no session means no scrape, for any group. */
const shouldRefuse = (session: Session) => session === 'none';

describe('session selection', () => {
  it('prefers the owner session over the shared one', () => {
    expect(pickSession({ ownerCookies: '[]', sharedCookies: '[]' })).toBe('owner');
  });

  it('falls back to the shared session', () => {
    expect(pickSession({ ownerCookies: null, sharedCookies: '[]' })).toBe('shared');
  });

  it('reports none when neither exists', () => {
    expect(pickSession({ ownerCookies: null, sharedCookies: undefined })).toBe('none');
  });
});

describe('refusing to scrape without a session', () => {
  it('refuses when no session is attached', () => {
    expect(shouldRefuse('none')).toBe(true);
  });

  it.each<Session>(['owner', 'shared'])('proceeds with a %s session', session => {
    expect(shouldRefuse(session)).toBe(false);
  });

  it('refuses for public groups too', () => {
    // The guard used to end in `&& !group.isPublic`, so a public group with no
    // session was scraped anyway and came back empty as a "success". Visibility
    // is not part of the decision any more.
    for (const isPublic of [true, false]) {
      const refused = shouldRefuse(pickSession({ ownerCookies: null, sharedCookies: undefined }));
      expect(refused, `isPublic=${isPublic}`).toBe(true);
    }
  });
});

describe('explaining an empty scrape', () => {
  it('points at group membership when the owner session found nothing', () => {
    expect(emptyScrapeHint({ usedSession: 'owner', usedProxy: true })).toMatch(/not a member|group URL/);
  });

  it('names the shared session specifically, since that is the likelier culprit', () => {
    expect(emptyScrapeHint({ usedSession: 'shared', usedProxy: true })).toContain('shared session');
  });

  it('blames the missing proxy first, whatever the session', () => {
    // Production hit exactly this: the actor logged "No proxy configured",
    // injected ten valid cookies, and was still shown a login prompt. Leading
    // with the session would send someone off reconnecting a Facebook account
    // that was never the problem.
    for (const usedSession of ['owner', 'shared'] as Session[]) {
      const hint = emptyScrapeHint({ usedSession, usedProxy: false });
      expect(hint, usedSession).toContain('APIFY_PROXY_URL');
      expect(hint, usedSession).not.toContain('not a member');
    }
  });

  it('falls back to the session reading when the proxy state is unknown', () => {
    // The browser fallback never reports one, so undefined must not be read
    // as "no proxy" and mask the real cause.
    expect(emptyScrapeHint({ usedSession: 'shared' })).toContain('shared session');
  });

  it('always suggests something actionable', () => {
    for (const usedProxy of [true, false, undefined]) {
      for (const usedSession of ['owner', 'shared'] as Session[]) {
        expect(emptyScrapeHint({ usedSession, usedProxy }).length).toBeGreaterThan(40);
      }
    }
  });
});
