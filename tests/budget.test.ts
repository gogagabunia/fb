import { describe, it, expect } from 'vitest';

/**
 * The cron route died at 60s with FUNCTION_INVOCATION_TIMEOUT (504), losing the
 * work of every group including ones that had already finished. The cause was
 * that each phase had its own budget — or none — instead of all of them working
 * back from one cutoff.
 *
 * These cover the arithmetic that decides when to stop. The constants are
 * mirrored from the modules rather than imported, because importing sync.ts
 * pulls in Prisma, the scraper and the parser.
 */

const REQUEST_BUDGET_MS = 50_000; // api/cron/scrape/route.ts
const MIN_TIME_PER_GROUP_MS = 12_000; // api/cron/scrape/route.ts
const PARSE_BUDGET_MS = 35_000; // lib/sync.ts
const WRAP_UP_RESERVE_MS = 5_000; // lib/sync.ts
const MAX_DURATION_MS = 60_000; // Vercel Hobby ceiling

/** Mirrors the cron loop's decision to start another group. */
const shouldStartGroup = (now: number, deadline: number) => now <= deadline - MIN_TIME_PER_GROUP_MS;

/** Mirrors the scrape timeout handed to the Apify call. */
const scrapeTimeout = (now: number, deadline: number) =>
  Math.max(5_000, deadline - now - WRAP_UP_RESERVE_MS);

/** Mirrors the parse cutoff: whichever of the two comes first. */
const parseDeadline = (now: number, deadline: number) =>
  Math.min(now + PARSE_BUDGET_MS, deadline - WRAP_UP_RESERVE_MS);

describe('request budget', () => {
  it('leaves headroom under the platform limit', () => {
    // The whole point is to stop ourselves before Vercel does.
    expect(REQUEST_BUDGET_MS).toBeLessThan(MAX_DURATION_MS);
    expect(MAX_DURATION_MS - REQUEST_BUDGET_MS).toBeGreaterThanOrEqual(5_000);
  });
});

describe('starting another group', () => {
  const start = 1_000_000;
  const deadline = start + REQUEST_BUDGET_MS;

  it('starts a group at the beginning of the run', () => {
    expect(shouldStartGroup(start, deadline)).toBe(true);
  });

  it('starts a group while there is more than the minimum left', () => {
    expect(shouldStartGroup(deadline - MIN_TIME_PER_GROUP_MS - 1, deadline)).toBe(true);
  });

  it('refuses once less than the minimum remains', () => {
    expect(shouldStartGroup(deadline - MIN_TIME_PER_GROUP_MS + 1, deadline)).toBe(false);
  });

  it('refuses past the deadline', () => {
    expect(shouldStartGroup(deadline + 1, deadline)).toBe(false);
  });
});

describe('scrape timeout', () => {
  const start = 1_000_000;
  const deadline = start + REQUEST_BUDGET_MS;

  it('hands the scrape the remaining time minus the wrap-up reserve', () => {
    expect(scrapeTimeout(start, deadline)).toBe(REQUEST_BUDGET_MS - WRAP_UP_RESERVE_MS);
  });

  it('shrinks as the run proceeds', () => {
    const early = scrapeTimeout(start, deadline);
    const late = scrapeTimeout(start + 30_000, deadline);
    expect(late).toBeLessThan(early);
  });

  it('never goes to zero or negative, which would abort instantly', () => {
    expect(scrapeTimeout(deadline, deadline)).toBeGreaterThanOrEqual(5_000);
    expect(scrapeTimeout(deadline + 60_000, deadline)).toBeGreaterThanOrEqual(5_000);
  });
});

describe('parse deadline', () => {
  const start = 1_000_000;

  it('uses the phase budget when the request deadline is far away', () => {
    const deadline = start + 300_000;
    expect(parseDeadline(start, deadline)).toBe(start + PARSE_BUDGET_MS);
  });

  it('uses the request deadline when that comes first', () => {
    // A scrape that ate most of the budget must not hand parsing a full 35s.
    const deadline = start + 10_000;
    expect(parseDeadline(start, deadline)).toBe(deadline - WRAP_UP_RESERVE_MS);
  });

  it('never exceeds the request deadline', () => {
    for (const remaining of [1_000, 10_000, 35_000, 50_000]) {
      const deadline = start + remaining;
      expect(parseDeadline(start, deadline)).toBeLessThanOrEqual(deadline);
    }
  });
});

describe('worst case stays inside the platform limit', () => {
  it('a single group cannot exceed the request budget', () => {
    const start = 0;
    const deadline = start + REQUEST_BUDGET_MS;

    // Scrape consumes everything it is allowed...
    const afterScrape = start + scrapeTimeout(start, deadline);
    // ...then parsing runs to its own cutoff...
    const afterParse = Math.max(afterScrape, parseDeadline(afterScrape, deadline));
    // ...and the import loop stops at the same reserve.
    const stopImporting = deadline - WRAP_UP_RESERVE_MS;

    expect(Math.max(afterParse, stopImporting)).toBeLessThanOrEqual(deadline);
    expect(deadline).toBeLessThan(MAX_DURATION_MS);
  });
});
