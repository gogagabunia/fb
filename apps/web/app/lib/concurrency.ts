/**
 * Run `worker` over `items` with a bounded number of concurrent calls,
 * preserving input order in the results.
 *
 * Extracted from sync.ts so it can be tested without pulling in Prisma, the
 * scraper and the parser.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}
