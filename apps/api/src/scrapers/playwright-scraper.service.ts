import { PrismaClient } from 'database';

// Reuse one PrismaClient across invocations — a per-instance client exhausts the
// connection pool when several syncs run in the same process.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const prismaClient = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prismaClient;
}

// Lightweight local Logger, so this module never pulls in @nestjs/common.
class Logger {
  constructor(private name: string) {}
  log(msg: string) { console.log(`[${this.name}] ${msg}`); }
  warn(msg: string) { console.warn(`[${this.name}] ${msg}`); }
  error(msg: string) { console.error(`[${this.name}] ${msg}`); }
}

export class PlaywrightScraperService {
  private readonly logger = new Logger(PlaywrightScraperService.name);
  private readonly prisma = prismaClient;

  /**
   * Id of the ScrapingLog row this scrape created, so the caller can write the
   * true import count back once parsing is done. Null until a scrape runs.
   */
  public lastScrapingLogId: string | null = null;

  /**
   * When true, scrape failures return canned mock posts instead of throwing.
   * Opt-in via USE_MOCK_SCRAPER=true — off by default so real failures surface.
   */
  private useMock(): boolean {
    return process.env.USE_MOCK_SCRAPER === 'true';
  }


  /**
   * Scrapes the most recent posts from a Facebook Group.
   * @param opts.sinceDays  only posts newer than N days; 0 for no date window
   * @param opts.maxPosts   hard upper bound on posts
   * @param opts.cookiesJson decrypted per-owner FB cookie JSON (private groups)
   * @param opts.timeoutMs  abort the Apify run after this long
   */
  async scrapeGroup(
    groupId: string,
    opts: { sinceDays?: number; maxPosts?: number; cookiesJson?: string | null; timeoutMs?: number } = {}
  ): Promise<{ title: string; text: string; images: string[]; author: string; id: string }[]> {
    const { sinceDays = 0, maxPosts = 5, cookiesJson = null, timeoutMs } = opts;

    const group = await this.prisma.facebookGroup.findUnique({
      where: { id: groupId }
    });

    if (!group) {
      throw new Error(`Facebook group ${groupId} not found`);
    }

    // ── Apify Integration Branch ────────────────────────────────────
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (apifyToken) {
      this.logger.log(`APIFY_API_TOKEN detected. Scraping group via Apify API...`);
      try {
        const posts = await this.scrapeGroupWithApify(group.url, {
          maxPosts,
          token: apifyToken,
          sinceDays,
          cookiesJson,
          timeoutMs
        });

        // Auto-approve admin verification status since scrape was successful
        await this.prisma.facebookGroup.update({
          where: { id: group.id },
          data: {
            adminVerified: true,
            adminVerifiedAt: new Date()
          }
        });

        // postsImported starts at 0 — only the caller knows how many posts
        // survive AI parsing. It used to be set to posts.length, which made
        // every log claim a 100% import rate.
        const log = await this.prisma.scrapingLog.create({
          data: {
            status: 'SUCCESS',
            postsScraped: posts.length,
            postsImported: 0,
            groupId: group.id,
            completedAt: new Date()
          }
        });
        this.lastScrapingLogId = log.id;

        return posts;
      } catch (error: any) {
        this.logger.error(`Apify scraping task failed: ${error?.message || error}`);

        // Record the real failure instead of masking it as a mock "success".
        await this.prisma.scrapingLog.create({
          data: {
            status: 'FAILED',
            postsScraped: 0,
            postsImported: 0,
            errorMessage: String(error?.message || error),
            groupId: group.id,
            completedAt: new Date()
          }
        });

        if (this.useMock()) {
          this.logger.log('USE_MOCK_SCRAPER set — returning mock classified fallback items.');
          return this.getMockPosts();
        }
        throw error;
      }
    }

    // ── Browser fallback ────────────────────────────────────────────
    // Loaded on demand so `playwright` stays out of the web app's server
    // bundle; it cannot run on Vercel and is only reachable with no Apify token.
    const { scrapeGroupWithBrowser } = await import('./browser-scraper');

    try {
      const result = await scrapeGroupWithBrowser(
        { id: group.id, name: group.name, url: group.url },
        {
          maxPosts,
          cookiesJson,
          log: (m: string) => this.logger.log(m),
          warn: (m: string) => this.logger.warn(m),
          error: (m: string) => this.logger.error(m)
        }
      );

      await this.prisma.facebookGroup.update({
        where: { id: group.id },
        data: { adminVerified: result.adminVerified, adminVerifiedAt: new Date() }
      });

      const log = await this.prisma.scrapingLog.create({
        data: {
          status: 'SUCCESS',
          postsScraped: result.containersFound,
          postsImported: 0, // filled in by the caller after AI parsing
          groupId: group.id,
          completedAt: new Date()
        }
      });
      this.lastScrapingLogId = log.id;

      return result.posts;
    } catch (error: any) {
      this.logger.warn(`Scraping task encountered a rate limit or login wall: ${error?.message || error}`);

      // Record the real failure instead of masking it as a mock "success".
      await this.prisma.scrapingLog.create({
        data: {
          status: 'FAILED',
          postsScraped: 0,
          postsImported: 0,
          errorMessage: String(error?.message || error),
          groupId: group.id,
          completedAt: new Date()
        }
      });

      if (this.useMock()) {
        this.logger.log('USE_MOCK_SCRAPER set — returning mock classified fallback items.');
        return this.getMockPosts();
      }
      throw error;
    }
  }

  /**
   * Scrapes group posts from Apify's synchronous actor execution API
   */
  private async scrapeGroupWithApify(
    groupUrl: string,
    opts: { maxPosts: number; token: string; sinceDays?: number; cookiesJson?: string | null; noCookies?: boolean; timeoutMs?: number }
  ): Promise<{ title: string; text: string; images: string[]; author: string; id: string }[]> {
    const { maxPosts, token, sinceDays, cookiesJson = null, noCookies = false, timeoutMs } = opts;
    this.logger.log(`Triggering Apify sync run for URL: ${groupUrl}`);

    // Input payload matching the whoareyouanas/facebook-group-scraper schema.
    // Field names must be exact: `maxPosts` (not resultsLimit), `viewOption`
    // controls which posts are returned (chronological group feed).
    const input: Record<string, any> = {
      startUrls: [
        { url: groupUrl }
      ],
      maxPosts: maxPosts,
      viewOption: 'CHRONOLOGICAL',
      includeMedia: true,
      includeGroupInfo: true
    };

    // Only pull posts newer than N days (the "last 30 days" sync window).
    if (sinceDays && sinceDays > 0) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      input.onlyPostsNewerThan = since.toISOString();
    }

    // Prefer per-owner cookies passed in for this sync; fall back to a global
    // FB_COOKIES env var. When noCookies is set (visibility probe), send NO
    // cookies at all so we truly test anonymous/public readability.
    const fbCookiesRaw = noCookies ? null : (cookiesJson || process.env.FB_COOKIES);
    if (fbCookiesRaw) {
      try {
        const rawCookies = JSON.parse(fbCookiesRaw);
        // Clean cookies to ensure compatibility with Puppeteer based actor
        input.cookies = rawCookies.map((c: any) => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path || '/',
          secure: typeof c.secure === 'boolean' ? c.secure : true,
          httpOnly: typeof c.httpOnly === 'boolean' ? c.httpOnly : true
        }));
        this.logger.log(`Passing ${rawCookies.length} cleaned Facebook session cookies to Apify.`);
      } catch (err: any) {
        this.logger.error(`Failed to parse cookies for Apify payload: ${err.message}`);
      }
    }

    // run-sync-get-dataset-items blocks until the actor finishes, with no
    // server-side cap. Unbounded, it swallowed the caller's whole budget — the
    // cron route died at 60s with FUNCTION_INVOCATION_TIMEOUT before parsing
    // anything.
    const controller = new AbortController();
    const timer = timeoutMs ? setTimeout(() => controller.abort(), timeoutMs) : null;

    let response: Response;
    try {
      response = await fetch(`https://api.apify.com/v2/acts/whoareyouanas~facebook-group-scraper/run-sync-get-dataset-items?token=${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        throw new Error(`Apify run exceeded the ${timeoutMs}ms budget for this sync.`);
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Apify API returned error status ${response.status}: ${errorText}`);
    }

    const items = await response.json();
    if (!Array.isArray(items)) {
      throw new Error('Apify API response is not an array of dataset items');
    }
    this.logger.log(`Apify completed successfully. Retrieved ${items.length} items from dataset.`);

    // Check if Apify returned any error items (e.g. content not available, login wall, etc.)
    const errorItem = items.find((item: any) => item.error);
    if (errorItem) {
      throw new Error(`Apify scraping error (${errorItem.error}): ${errorItem.errorDescription || 'No error description provided.'}`);
    }

    // Map the whoareyouanas actor's output to our standard post structure.
    // Real field names (confirmed from the actor's dataset):
    //   postId, postUrl, authorName, text, images[], videos[], timestamp
    // We key on `postUrl` (the real clickable group-post link) so the stored id
    // is unmistakably a group post and "View original" works.
    return items.map((item: any) => {
      const text = String(item.text ?? '');
      const postUrl = String(item.postUrl ?? '');

      const images: string[] = [];
      for (const field of [item.images, item.videos]) {
        if (Array.isArray(field)) {
          for (const m of field) {
            const url = typeof m === 'string' ? m : (m?.url || m?.src || '');
            if (url && /^https?:\/\//.test(url)) images.push(url);
          }
        }
      }

      // Identifier / dedup key: prefer the full post URL; fall back to postId.
      const id = postUrl || String(item.postId ?? `fb-${Math.random().toString(36).substring(7)}`);

      return {
        id,
        text,
        images: [...new Set(images)],
        author: String(item.authorName || 'Facebook User'),
        title: (text.split('\n')[0].substring(0, 100) || 'Facebook Group Post')
      };
    });
  }

  /**
   * Helper to return standard mock posts when scraping fails
   */
  private getMockPosts(): { id: string; author: string; text: string; images: string[]; title: string }[] {
    return [
      {
        id: `fb-mock-${Date.now()}-1`,
        author: 'Michael R.',
        text: `🚨 CAR FOR SALE 🚨\n2018 Honda Accord EX-L in pristine condition. Single owner, clean title, garage kept. Only 45,000 miles. Automatic transmission, leather seats, Apple CarPlay, and sunroof. Drives like new! Asking $18,500 OBO. Located in Scottsdale, AZ. Serious inquiries only!`,
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBF53vlfHp3g1BV1rgPrV-1yeYLvNtqpKPw0i1q-Gc1ZUVvrZrFdFLV0fcXcW2pMyLPTfsH556JOdQQm0AN9WoBnyTkUEuA333WtiHy1Yu0J6aDr0IlgO6dOjON3KsnBbY3lUcyrMGengoTLrxIf_GBGAccKxBrx8QcdSRjF-IJtvmKijQEgQTXROyqtsUQ1qzb74KCHFBaKOz_c4Tez8Dkbd06M6Q4rPwBsB6N7mhRxupy1ZgF7kX-P8WLVeKNl0J3TytHH_3TWf8'],
        title: '2018 Honda Accord EX-L'
      },
      {
        id: `fb-mock-${Date.now()}-2`,
        author: 'Sarah Jenkins',
        text: `Hey guys, selling my Custom Mechanical Keyboard. Built it a couple of months ago but moving to a low-profile board. \nSpecs: GMMK Pro 75% Layout, Lubed Gateron Yellow switches, Brass switch plate, Durck keycaps. Comes with custom coiled cable. Sounds amazing, super thacky. Looking for $180 shipped or local pickup. NYC area.`,
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuBF53vlfHp3g1BV1rgPrV-1yeYLvNtqpKPw0i1q-Gc1ZUVvrZrFdFLV0fcXcW2pMyLPTfsH556JOdQQm0AN9WoBnyTkUEuA333WtiHy1Yu0J6aDr0IlgO6dOjON3KsnBbY3lUcyrMGengoTLrxIf_GBGAccKxBrx8QcdSRjF-IJtvmKijQEgQTXROyqtsUQ1qzb74KCHFBaKOz_c4Tez8Dkbd06M6Q4rPwBsB6N7mhRxupy1ZgF7kX-P8WLVeKNl0J3TytHH_3TWf8'],
        title: 'Custom Mechanical Keyboard'
      },
      {
        id: `fb-mock-${Date.now()}-3`,
        author: 'David K.',
        text: `Selling a Sony WH-1000XM4 Noise Cancelling Headphones in Silver. Very minor wear, used primarily in an office setting. Active noise cancellation is incredible, battery life is still perfect (approx 30 hours). Original case and audio cable included. No charging brick. Selling for $160. Can meet up in downtown Phoenix.`,
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuAeaZ6ck25wLLPblFfVVyHzyj8e889AHIabISceQfsVvETeS5FS1ZZuTlz1mHlZP2ITrkgj3SWDPBwEaxOuiOFTPxTu5j1q4aEy8THNNG_V3ya_GhQp3zmUZMHaBxu_TZfFHlsGE0ShhfIXkIY20KS0wAmvMNeOGt1HAmXBs8lghNdfVsoj7JV6q9EjQ3pkwpqns5qmdYInk1iFpsisjJX7rpTzLVHHxzagb2C9QDyoYCy5SGg5GbcRbruvdf5Pbbtw7ousXZIGj1k'],
        title: 'Sony WH-1000XM4 Headphones'
      },
      {
        id: `fb-mock-${Date.now()}-4`,
        author: 'Emma Watson',
        text: `iPhone 13 Pro 128GB - Graphite Gray. Unlocked, battery health at 88%. Upgraded to the 15, so no longer need this one. Always kept in a Spigen case with a tempered glass screen protector. Screen is flawless, very minor micro-scratches on the stainless steel sides. Asking $420. Cash only, no shipping.`,
        images: ['https://lh3.googleusercontent.com/aida-public/AB6AXuArpcPzzBgh65cU8PR5epqDy4__tzxjf7obJN7GqPhZ5i54vLkytRwIvuhqX2mordT3JX7W3mAMVho-9FopzXTT4CLgDDwKMXYib1wtTi6uoJI9bqO5skx1ynpMB85vmH6kfFb37m3GPy3J1iU_mpMb4Ov31OM4FSaphBmM2jxA8LR1DGj_W34zVvFLNFCXDtRK_WoYedQUIfqLlNn5GXt1zXA1YZ5b94095TOYooxpDw1L-EJ54jwxTfu-D0_6yAfhPh997le-DsU'],
        title: 'iPhone 13 Pro 128GB'
      },
      {
        id: `fb-mock-${Date.now()}-5`,
        author: 'Gary Cooper',
        text: `Looking for local groups to ride with this weekend! Anyone active around Scottsdale? Also, is there anyone selling a good gravel bike? Budget is $1,000.`,
        images: [],
        title: 'Looking for riding group'
      }
    ];
  }
}
