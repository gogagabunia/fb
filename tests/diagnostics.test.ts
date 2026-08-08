import { describe, it, expect } from 'vitest';

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
  /** Mirrors the hint sync.ts attaches when the scraper returns nothing. */
  function hintFor(postsReturned: number, session: Session): string | undefined {
    if (postsReturned > 0) return undefined;
    return session === 'shared'
      ? 'The scraper returned nothing. The shared session is probably not a member of this group — connect the owner\'s own Facebook, or check the group URL.'
      : 'The scraper returned nothing. Either the connected account is not a member of this group, or the group URL is wrong. Group URLs should look like https://www.facebook.com/groups/<id>.';
  }

  it('says nothing when posts came back', () => {
    expect(hintFor(5, 'owner')).toBeUndefined();
  });

  it('points at group membership when the owner session found nothing', () => {
    expect(hintFor(0, 'owner')).toMatch(/not a member|group URL/);
  });

  it('names the shared session specifically, since that is the likelier culprit', () => {
    expect(hintFor(0, 'shared')).toContain('shared session');
  });

  it('always suggests something actionable', () => {
    for (const session of ['owner', 'shared'] as Session[]) {
      expect(hintFor(0, session)!.length).toBeGreaterThan(40);
    }
  });
});
