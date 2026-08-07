import { describe, it, expect } from 'vitest';
import { mapWithConcurrency } from '../apps/web/app/lib/concurrency';

/**
 * Sync parses posts through an LLM. It used to await one at a time, which blew
 * the cron's 60s budget and starved every group after the first.
 */
describe('mapWithConcurrency', () => {
  it('preserves input order regardless of completion order', async () => {
    const items = [30, 10, 20, 5];
    const result = await mapWithConcurrency(items, 4, async (ms) => {
      await new Promise((r) => setTimeout(r, ms));
      return ms;
    });
    expect(result).toEqual(items);
  });

  it('never exceeds the concurrency limit', async () => {
    let live = 0;
    let peak = 0;

    await mapWithConcurrency([...Array(23).keys()], 5, async () => {
      live++;
      peak = Math.max(peak, live);
      await new Promise((r) => setTimeout(r, 5));
      live--;
    });

    expect(peak).toBeLessThanOrEqual(5);
    expect(peak).toBeGreaterThan(1); // and it is genuinely parallel
  });

  it('processes every item exactly once', async () => {
    const seen: number[] = [];
    await mapWithConcurrency([...Array(50).keys()], 7, async (n) => {
      seen.push(n);
    });
    expect(seen).toHaveLength(50);
    expect(new Set(seen).size).toBe(50);
  });

  it('returns immediately for an empty list instead of hanging', async () => {
    expect(await mapWithConcurrency([], 5, async (x) => x)).toEqual([]);
  });

  it('handles fewer items than the limit', async () => {
    expect(await mapWithConcurrency([1, 2], 10, async (x) => x * 2)).toEqual([2, 4]);
  });

  it('propagates a worker rejection rather than resolving silently', async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (n) => {
        if (n === 2) throw new Error('boom');
        return n;
      })
    ).rejects.toThrow('boom');
  });
});
