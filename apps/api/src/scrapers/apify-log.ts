/**
 * Pure helpers for talking to Apify, kept out of the scraper service so they
 * can be tested without dragging in Prisma (the service opens a client at
 * module scope).
 */

/** Apify's own ceiling for `waitForFinish`. */
export const APIFY_MAX_WAIT_SECONDS = 60;

/** Time held back after the run so the dataset — and its log — can be read. */
export const APIFY_TAIL_RESERVE_MS = 6_000;

/** How much actor log to keep. The useful part ("found 0 posts") is at the end. */
export const APIFY_LOG_TAIL_CHARS = 2_000;

/**
 * How long to block on a run, given the budget for the whole Apify phase.
 *
 * Always lands in Apify's accepted range: a budget smaller than the reserve
 * would otherwise produce zero or a negative, which the API rejects outright.
 */
export function apifyWaitSeconds(budgetMs: number): number {
  return Math.min(
    APIFY_MAX_WAIT_SECONDS,
    Math.max(1, Math.floor((budgetMs - APIFY_TAIL_RESERVE_MS) / 1000))
  );
}

/**
 * Strip session cookies out of an actor log before it is stored or reported.
 *
 * Actors routinely echo their input on startup, and this text travels into cron
 * telemetry and CI logs — where a Facebook `xs` value would be a live session
 * for anyone reading. Removes the exact values we sent, then any remaining
 * `"value": "…"` pairs, which is the shape cookies are echoed in.
 */
export function redactApifyLog(text: string, secrets: string[]): string {
  let out = text;
  for (const secret of secrets) {
    // Very short values can't be identified safely and would mangle the log.
    if (secret && secret.length >= 4) out = out.split(secret).join('***');
  }
  return out.replace(/("value"\s*:\s*)"[^"]*"/g, '$1"***"');
}
