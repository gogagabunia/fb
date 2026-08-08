/**
 * Plain-language readings of a sync that imported nothing.
 *
 * Kept apart from `sync.ts` so it can be tested directly — importing that file
 * drags in Prisma, the scraper and the parser.
 */

export type UsedSession = 'owner' | 'shared' | 'none';

/**
 * Why a scrape came back with no posts.
 *
 * Ordered by what production actually hit, most-blocking first. Facebook puts
 * up the IP wall before it looks at the session at all: the actor logged
 * `No proxy configured`, injected ten valid cookies anyway, and was still shown
 * a login prompt. Naming the session first would have sent someone off
 * reconnecting a Facebook account that was never the problem.
 */
export function emptyScrapeHint(opts: { usedSession: UsedSession; usedProxy?: boolean }): string {
  const { usedSession, usedProxy } = opts;

  if (usedProxy === false) {
    return (
      'The scraper ran without a proxy, and Facebook blocks the datacenter IPs Apify runs on — ' +
      'it was shown a login wall even though the session was sent. Set APIFY_PROXY_URL to a ' +
      'residential proxy.'
    );
  }

  if (usedSession === 'shared') {
    return (
      'The scraper returned nothing. The shared session is probably not a member of this group — ' +
      "connect the owner's own Facebook, or check the group URL."
    );
  }

  return (
    'The scraper returned nothing. Either the connected account is not a member of this group, ' +
    'or the group URL is wrong. Group URLs should look like https://www.facebook.com/groups/<id>.'
  );
}
