/**
 * Pure helpers for talking to Apify, kept out of the scraper service so they
 * can be tested without dragging in Prisma (the service opens a client at
 * module scope).
 */

/** What `APIFY_PROXY_URL` should look like, quoted back when it doesn't. */
export const APIFY_PROXY_URL_EXAMPLE =
  'http://groups-RESIDENTIAL:<password>@proxy.apify.com:8000';

/**
 * The configured proxy URL, tolerant of how an env var tends to be pasted.
 *
 * Returns `{}` when unset, `{ url }` when usable, `{ error }` when it is set
 * but cannot work — the caller should refuse to start a run rather than burn
 * one per group discovering the same thing.
 *
 * Every Apify run in production failed with `Expected property string values to
 * be a URL, got 'APIFY_PROXY_URL = ***@proxy.apify.com:8000'`: the whole
 * `NAME = value` line had gone into the value box. Surrounding quotes and stray
 * whitespace are the same class of mistake and are stripped too.
 *
 * The offending value is never echoed in `error` — it carries the proxy
 * password, and these strings travel into cron telemetry and CI logs.
 */
export function normalizeProxyUrl(raw: string | undefined): { url?: string; error?: string } {
  if (!raw || !raw.trim()) return {};

  let value = raw.trim();
  value = value.replace(/^APIFY_PROXY_URL\s*=\s*/i, '').trim();
  value = value.replace(/^(["'])([\s\S]*)\1$/, '$2').trim();

  if (!value) {
    return { error: `APIFY_PROXY_URL is set but empty. Expected ${APIFY_PROXY_URL_EXAMPLE}` };
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return { error: `APIFY_PROXY_URL is not a valid URL. Expected ${APIFY_PROXY_URL_EXAMPLE}` };
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      error: `APIFY_PROXY_URL must be http or https, not "${parsed.protocol}". Expected ${APIFY_PROXY_URL_EXAMPLE}`
    };
  }

  return { url: value };
}

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
