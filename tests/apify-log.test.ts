import { describe, it, expect } from 'vitest';
import {
  APIFY_MAX_WAIT_SECONDS,
  apifyWaitSeconds,
  redactApifyLog
} from '../apps/api/src/scrapers/apify-log';

/**
 * A sync that reported zero posts with an `owner` session and a well-formed
 * group URL had nowhere left to look: the scrape endpoint returned the dataset
 * rows and nothing else, so a failed run, a login wall and an empty group all
 * arrived as `[]`. The run is now started explicitly and its log read when it
 * produces nothing — which means that log has to be safe to print.
 */

describe('apifyWaitSeconds', () => {
  it('leaves room after the run to read the dataset and log', () => {
    expect(apifyWaitSeconds(45_000)).toBe(39);
  });

  it('never exceeds the ceiling the API accepts', () => {
    expect(apifyWaitSeconds(10 * 60 * 1000)).toBe(APIFY_MAX_WAIT_SECONDS);
  });

  it('stays positive when the budget is smaller than the reserve', () => {
    // Math.floor of a negative would send 0 or less, which Apify rejects
    // outright — turning a tight budget into a hard API error.
    for (const budget of [0, 1_000, 6_000]) {
      expect(apifyWaitSeconds(budget), `budget=${budget}`).toBe(1);
    }
  });
});

describe('redactApifyLog', () => {
  it('removes the session values we sent', () => {
    const log = 'INFO Input: {"cookies":[{"name":"xs","value":"42%3AsecretSession%3A2"}]}';
    const out = redactApifyLog(log, ['42%3AsecretSession%3A2']);
    expect(out).not.toContain('secretSession');
    expect(out).toContain('***');
  });

  it('redacts cookie values echoed in a shape we did not send', () => {
    const out = redactApifyLog('{"name":"c_user","value":"100000123456789"}', []);
    expect(out).not.toContain('100000123456789');
  });

  it('ignores values too short to identify', () => {
    // Redacting "1" would replace every digit in the log and destroy it.
    const log = 'Scraped 1 page, found 0 posts';
    expect(redactApifyLog(log, ['1'])).toBe(log);
  });

  it('keeps the diagnostic text intact', () => {
    const log = 'WARN Login required — redirected to /login.php\n{"value":"abcd1234"}';
    const out = redactApifyLog(log, ['abcd1234']);
    expect(out).toContain('Login required');
    expect(out).not.toContain('abcd1234');
  });

  it('replaces every occurrence, not just the first', () => {
    const out = redactApifyLog('tok=abcd1234 retry tok=abcd1234', ['abcd1234']);
    expect(out).not.toContain('abcd1234');
    expect(out.match(/\*\*\*/g)).toHaveLength(2);
  });
});
