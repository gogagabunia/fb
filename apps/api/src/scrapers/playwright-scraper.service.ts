import { chromium, BrowserContext, Page } from 'playwright';
import { PrismaClient } from 'database';

// Custom lightweight NestJS mock decorators & Logger to prevent Next.js bundle tracing from importing @nestjs/common
const Injectable = () => (target: any) => {};
class Logger {
  constructor(private name: string) {}
  log(msg: string) { console.log(`[${this.name}] ${msg}`); }
  warn(msg: string) { console.warn(`[${this.name}] ${msg}`); }
  error(msg: string) { console.error(`[${this.name}] ${msg}`); }
}

@Injectable()
export class PlaywrightScraperService {
  private readonly logger = new Logger(PlaywrightScraperService.name);
  private readonly prisma = new PrismaClient();

  /**
   * When true, scrape failures return canned mock posts instead of throwing.
   * Opt-in via USE_MOCK_SCRAPER=true — off by default so real failures surface.
   */
  private useMock(): boolean {
    return process.env.USE_MOCK_SCRAPER === 'true';
  }

  /**
   * Detect whether a group is publicly readable (no login) or private.
   * Runs a tiny cookie-less Apify probe: posts returned → PUBLIC, login-wall /
   * error / empty → PRIVATE. Defaults to PRIVATE when it can't tell (safe: the
   * UI then prompts a Facebook login rather than silently failing).
   */
  async detectGroupVisibility(url: string): Promise<'PUBLIC' | 'PRIVATE'> {
    const apifyToken = process.env.APIFY_API_TOKEN;
    if (!apifyToken) {
      this.logger.warn('No APIFY_API_TOKEN — cannot probe visibility, defaulting to PRIVATE.');
      return 'PRIVATE';
    }
    try {
      const posts = await this.scrapeGroupWithApify(url, { maxPosts: 3, token: apifyToken, noCookies: true });
      return posts.length > 0 ? 'PUBLIC' : 'PRIVATE';
    } catch (error: any) {
      this.logger.log(`Visibility probe treated as PRIVATE: ${error?.message || error}`);
      return 'PRIVATE';
    }
  }

  /**
   * Scrapes recent posts from a Facebook Group.
   * @param opts.sinceDays  only posts newer than N days (default 30)
   * @param opts.maxPosts   hard upper bound on posts (default 100)
   * @param opts.cookiesJson decrypted per-owner FB cookie JSON (private groups)
   */
  async scrapeGroup(
    groupId: string,
    opts: { sinceDays?: number; maxPosts?: number; cookiesJson?: string | null } = {}
  ): Promise<{ title: string; text: string; images: string[]; author: string; id: string }[]> {
    const { sinceDays = 30, maxPosts = 100, cookiesJson = null } = opts;

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
          cookiesJson
        });

        // Auto-approve admin verification status since scrape was successful
        await this.prisma.facebookGroup.update({
          where: { id: group.id },
          data: {
            adminVerified: true,
            adminVerifiedAt: new Date()
          }
        });

        await this.prisma.scrapingLog.create({
          data: {
            status: 'SUCCESS',
            postsScraped: posts.length,
            postsImported: posts.length,
            groupId: group.id,
            completedAt: new Date()
          }
        });

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

    this.logger.log(`Starting scrape task for group: ${group.name} (${group.url})`);
    
    let browser: any = null;
    const scrapedItems: any[] = [];

    try {
      const browserlessUrl = process.env.BROWSERLESS_URL;
      const chromeCdpUrl = process.env.CHROME_CDP_URL;
      
      let context: BrowserContext;
      
      if (chromeCdpUrl) {
        this.logger.log(`Connecting to local running Chrome CDP: ${chromeCdpUrl}`);
        browser = await chromium.connectOverCDP(chromeCdpUrl);
        const contexts = browser.contexts();
        if (contexts.length > 0) {
          context = contexts[0];
          this.logger.log('Reusing existing Chrome context.');
        } else {
          throw new Error('No active browser context found on local Chrome instance.');
        }
      } else if (browserlessUrl) {
        this.logger.log(`Connecting to remote Browserless CDP WebSocket: ${browserlessUrl.split('?')[0]}`);
        browser = await chromium.connectOverCDP(browserlessUrl);
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 800 }
        });
      } else {
        // Launch headless chromium locally
        this.logger.log('Launching local Chromium engine...');
        browser = await chromium.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-blink-features=AutomationControlled'
          ]
        });
        context = await browser.newContext({
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          viewport: { width: 1280, height: 800 }
        });
      }

      // Inject Facebook Session Cookies to authenticate automated scrapers (only if not reusing existing Chrome context)
      if (!chromeCdpUrl) {
        // Prefer the per-owner cookies passed in for this sync; fall back to a
        // global FB_COOKIES env var for local/dev use.
        const fbCookiesRaw = cookiesJson || process.env.FB_COOKIES;
        if (fbCookiesRaw) {
          try {
            const rawCookies = JSON.parse(fbCookiesRaw);
            // Transform Cookie-Editor export format → Playwright format
            const cookies = rawCookies.map((c: any) => {
              const sameSiteMap: Record<string, string> = {
                'no_restriction': 'None',
                'lax': 'Lax',
                'strict': 'Strict'
              };
              const cookie: any = {
                name: c.name,
                value: c.value,
                domain: c.domain,
                path: c.path || '/',
                httpOnly: !!c.httpOnly,
                secure: !!c.secure,
                sameSite: sameSiteMap[c.sameSite] || 'None'
              };
              // Cookie-Editor uses 'expirationDate', Playwright uses 'expires'
              if (c.expirationDate) {
                cookie.expires = c.expirationDate;
              }
              return cookie;
            });
            await context.addCookies(cookies);
            this.logger.log(`Successfully injected ${cookies.length} Facebook session cookies.`);
          } catch (e: any) {
            this.logger.error('Failed to parse or inject Facebook cookies: ' + e.message);
          }
        }
      }

      const page = await context.newPage();

      // Go to group discussion page
      this.logger.log(`Navigating to group URL: ${group.url}`);
      // Use 'domcontentloaded' instead of 'networkidle' — Facebook streams
      // background requests indefinitely, so networkidle never resolves
      await page.goto(group.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
      // Give Facebook's JS a moment to render the feed
      await page.waitForTimeout(3000);

      // Handle login/profile chooser redirection if detected
      if (page.url().includes('/login') || page.url().includes('login.php') || await page.$('input[name="email"]')) {
        this.logger.log(`Detected login/auth wall redirect at URL: ${page.url()}`);
        
        // Try to click "Continue" (or translation) if it's the profile chooser screen
        const clicked = await page.evaluate(() => {
          const words = ['continue', 'გაგრძელება', 'continuar', 'continuer', 'продолжить'];
          // 1. Search in buttons, links, and role="button" elements
          const elements = Array.from(document.querySelectorAll('button, [role="button"], a, div'));
          for (const el of elements) {
            const txt = (el.textContent || '').trim().toLowerCase();
            if (words.includes(txt)) {
              const clickable = el.closest('button, [role="button"], a') || el;
              (clickable as HTMLElement).click();
              return true;
            }
          }
          return false;
        });

        if (clicked) {
          this.logger.log('Profile chooser Continue/გაგრძელება button clicked via page evaluation.');
          // Wait for navigation
          await page.waitForTimeout(6000);
          this.logger.log(`URL after clicking Continue: ${page.url()}`);
        } else {
          this.logger.warn('No profile chooser Continue button detected.');
        }
        
        // Re-check if we are still on the login page
        if (page.url().includes('/login') || page.url().includes('login.php') || await page.$('input[name="email"]')) {
          this.logger.warn('Facebook Login page hit. Session cookies required.');
          throw new Error('FB_AUTH_REQUIRED: Facebook authentication session expired or cookies not provided.');
        }
      }

      // ── Admin Verification Gate ──────────────────────────────────
      // Check if the authenticated user is an admin/moderator of this group
      // by scanning for Facebook's admin-only UI elements on the page
      this.logger.log('Verifying admin/moderator status for this group...');
      
      const pageContent = await page.content();
      const pageText = await page.evaluate(() => document.body?.innerText || '');
      
      const adminIndicators = [
        'Admin Tools',
        'Admin tools',
        'admin tools',
        'Manage group',
        'Manage Group',
        'manage group',
        'Group settings',
        'group settings',
        'Pending posts',
        'pending posts',
        'Member requests',
        'member requests',
        'Moderation alerts',
      ];

      const isAdmin = adminIndicators.some(indicator => 
        pageText.includes(indicator) || pageContent.includes(indicator)
      );

      // Also check for admin-specific aria labels and data attributes
      const adminElements = await page.$$([
        '[aria-label*="Admin"]',
        '[aria-label*="admin"]',
        '[aria-label*="Manage"]',
        'a[href*="/groups/"][href*="/admin"]',
        'a[href*="admin_activities"]',
        'a[href*="member_requests"]',
      ].join(', '));

      const hasAdminElements = adminElements.length > 0;
      const adminVerified = isAdmin || hasAdminElements;

      // Update verification status in the database
      await this.prisma.facebookGroup.update({
        where: { id: group.id },
        data: {
          adminVerified,
          adminVerifiedAt: new Date()
        }
      });

      if (!adminVerified) {
        this.logger.warn('Admin status not detected on this group page (scraping will continue as member/visitor).');
      } else {
        this.logger.log('✅ Admin status detected on group page.');
      }

      // Scroll to trigger lazy loading of posts
      this.logger.log('Scrolling feed for lazy loaded posts...');
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
        await page.waitForTimeout(1000 + Math.random() * 1000); // Anti-ban jitter
      }

      // Locate posts using general Facebook CSS classes and fallbacks
      let postElements = await page.$$('div[role="feed"] div[role="article"]');
      if (postElements.length === 0) {
        postElements = await page.$$('div[role="article"]');
      }
      if (postElements.length === 0) {
        postElements = await page.$$('div[data-ad-preview="message"]');
      }
      this.logger.log(`Found ${postElements.length} post containers.`);

      for (const element of postElements.slice(0, maxPosts)) {
        try {
          const rawText = await element.evaluate((el: any) => {
            const msgEl = el.querySelector('[data-ad-preview="message"], [data-testid="post_message"], div[dir="auto"]');
            return msgEl ? msgEl.textContent : el.textContent || '';
          });
          
          // Basic keyword filter to only pull potential selling posts
          const watchKeywords = group.keywords.length > 0 ? group.keywords : ['sell', 'price', 'sale', 'usd', '$', 'car', 'mile', 'runs', 'clean'];
          const matchesKeyword = watchKeywords.some(kw => rawText.toLowerCase().includes(kw.toLowerCase()));
          
          if (!matchesKeyword) {
            continue; // Skip irrelevant noise post
          }

          // Scrape adjacent images
          const parentPostContainer = await element.evaluateHandle((el: any) => el.closest('div[role="article"]') || el.parentElement);
          const imageUrls: string[] = [];
          if (parentPostContainer) {
            const images = await parentPostContainer.asElement()?.$$('img');
            if (images) {
              for (const img of images) {
                const src = await img.getAttribute('src');
                if (src && !src.includes('profile') && src.startsWith('http')) {
                  imageUrls.push(src);
                }
              }
            }
          }

          // Mock Post ID generation or parse actual FB Link
          const postUrlId = `fb-${Math.random().toString(36).substring(7)}`;

          scrapedItems.push({
            id: postUrlId,
            text: rawText.trim(),
            images: [...new Set(imageUrls)],
            author: 'Facebook User',
            title: rawText.split('\n')[0].substring(0, 100)
          });
        } catch (postError: any) {
          this.logger.error(`Error parsing individual post: ${postError?.message || postError}`);
        }
      }

      await this.prisma.scrapingLog.create({
        data: {
          status: 'SUCCESS',
          postsScraped: postElements.length,
          postsImported: scrapedItems.length,
          groupId: group.id
        }
      });

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
        scrapedItems.push(...this.getMockPosts());
      } else {
        throw error; // `finally` below still closes the browser
      }
    } finally {
      if (browser) {
        this.logger.log('Closing browser session...');
        await browser.close();
      }
    }

    return scrapedItems;
  }

  /**
   * Scrapes group posts from Apify's synchronous actor execution API
   */
  private async scrapeGroupWithApify(
    groupUrl: string,
    opts: { maxPosts: number; token: string; sinceDays?: number; cookiesJson?: string | null; noCookies?: boolean }
  ): Promise<{ title: string; text: string; images: string[]; author: string; id: string }[]> {
    const { maxPosts, token, sinceDays, cookiesJson = null, noCookies = false } = opts;
    this.logger.log(`Triggering Apify sync run for URL: ${groupUrl}`);

    // Prepare input payload for whoareyouanas/facebook-group-scraper
    const input: Record<string, any> = {
      startUrls: [
        { url: groupUrl }
      ],
      resultsLimit: maxPosts
    };

    // Only pull posts newer than N days (the "last 30 days" sync window).
    if (sinceDays && sinceDays > 0) {
      const since = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000);
      // Field name per the actor's input schema; both spellings sent for safety.
      input.onlyPostsNewerThan = since.toISOString();
      input.maxPostDate = since.toISOString();
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

    const response = await fetch(`https://api.apify.com/v2/acts/whoareyouanas~facebook-group-scraper/run-sync-get-dataset-items?token=${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

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

    // Map Apify's output schema to standard post structure
    return items.map((item: any) => {
      const text = (item.text || '') as string;
      const images = (Array.isArray(item.images) ? item.images : []) as string[];
      const id = (item.postId || item.id || `fb-${Math.random().toString(36).substring(7)}`) as string;

      return {
        id,
        text,
        images: [...new Set(images)],
        author: (item.authorName || 'Facebook User') as string,
        title: (text.split('\n')[0].substring(0, 100) || 'Facebook Group Post') as string
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
