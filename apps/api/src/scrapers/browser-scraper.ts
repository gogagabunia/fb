import { chromium, BrowserContext } from 'playwright';
import { createHash } from 'crypto';

/**
 * Playwright-based Facebook group scraper.
 *
 * Split out of playwright-scraper.service.ts, which had grown to 600 lines
 * holding two unrelated scrapers. The orchestrator now imports this module
 * dynamically, and only when there is no APIFY_API_TOKEN.
 *
 * Note that the dynamic import alone does not keep `playwright` out of the
 * deployed bundle — Next's tracer follows it regardless. Excluding it is done
 * explicitly via outputFileTracingExcludes in apps/web/next.config.mjs.
 *
 * Deliberately knows nothing about the database: it returns what it found and
 * the caller decides what to persist.
 */

export interface BrowserScrapeGroup {
  id: string;
  name: string;
  url: string;
}

export interface ScrapedPost {
  id: string;
  title: string;
  text: string;
  images: string[];
  author: string;
}

export interface BrowserScrapeResult {
  posts: ScrapedPost[];
  /** Number of post containers seen on the page. */
  containersFound: number;
  adminVerified: boolean;
}

export interface BrowserScrapeOptions {
  maxPosts?: number;
  cookiesJson?: string | null;
  log?: (msg: string) => void;
  warn?: (msg: string) => void;
  error?: (msg: string) => void;
}

export async function scrapeGroupWithBrowser(
  group: BrowserScrapeGroup,
  opts: BrowserScrapeOptions = {}
): Promise<BrowserScrapeResult> {
  const {
    maxPosts = 5,
    cookiesJson = null,
    log = console.log,
    warn = console.warn,
    error = console.error
  } = opts;

  log(`Starting scrape task for group: ${group.name} (${group.url})`);

  let browser: any = null;
  const posts: ScrapedPost[] = [];

  try {
    const browserlessUrl = process.env.BROWSERLESS_URL;
    const chromeCdpUrl = process.env.CHROME_CDP_URL;

    let context: BrowserContext;

    if (chromeCdpUrl) {
      log(`Connecting to local running Chrome CDP: ${chromeCdpUrl}`);
      browser = await chromium.connectOverCDP(chromeCdpUrl);
      const contexts = browser.contexts();
      if (contexts.length > 0) {
        context = contexts[0];
        log('Reusing existing Chrome context.');
      } else {
        throw new Error('No active browser context found on local Chrome instance.');
      }
    } else if (browserlessUrl) {
      log(`Connecting to remote Browserless CDP WebSocket: ${browserlessUrl.split('?')[0]}`);
      browser = await chromium.connectOverCDP(browserlessUrl);
      context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 800 }
      });
    } else {
      log('Launching local Chromium engine...');
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

    // Inject Facebook session cookies (skipped when reusing an existing Chrome
    // context, which is already logged in).
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
          log(`Successfully injected ${cookies.length} Facebook session cookies.`);
        } catch (e: any) {
          error('Failed to parse or inject Facebook cookies: ' + e.message);
        }
      }
    }

    const page = await context.newPage();

    log(`Navigating to group URL: ${group.url}`);
    // 'domcontentloaded' rather than 'networkidle' — Facebook streams background
    // requests indefinitely, so networkidle never resolves.
    await page.goto(group.url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForTimeout(3000);

    // Handle login / profile-chooser redirection if detected
    if (page.url().includes('/login') || page.url().includes('login.php') || await page.$('input[name="email"]')) {
      log(`Detected login/auth wall redirect at URL: ${page.url()}`);

      const clicked = await page.evaluate(() => {
        const words = ['continue', 'გაგრძელება', 'continuar', 'continuer', 'продолжить'];
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
        log('Profile chooser Continue button clicked via page evaluation.');
        await page.waitForTimeout(6000);
        log(`URL after clicking Continue: ${page.url()}`);
      } else {
        warn('No profile chooser Continue button detected.');
      }

      if (page.url().includes('/login') || page.url().includes('login.php') || await page.$('input[name="email"]')) {
        warn('Facebook Login page hit. Session cookies required.');
        throw new Error('FB_AUTH_REQUIRED: Facebook authentication session expired or cookies not provided.');
      }
    }

    // ── Admin verification ────────────────────────────────────────────
    log('Verifying admin/moderator status for this group...');

    const pageContent = await page.content();
    const pageText = await page.evaluate(() => document.body?.innerText || '');

    const adminIndicators = [
      'Admin Tools', 'Admin tools', 'admin tools',
      'Manage group', 'Manage Group', 'manage group',
      'Group settings', 'group settings',
      'Pending posts', 'pending posts',
      'Member requests', 'member requests',
      'Moderation alerts'
    ];

    const isAdmin = adminIndicators.some(indicator =>
      pageText.includes(indicator) || pageContent.includes(indicator)
    );

    const adminElements = await page.$$([
      '[aria-label*="Admin"]',
      '[aria-label*="admin"]',
      '[aria-label*="Manage"]',
      'a[href*="/groups/"][href*="/admin"]',
      'a[href*="admin_activities"]',
      'a[href*="member_requests"]'
    ].join(', '));

    const adminVerified = isAdmin || adminElements.length > 0;

    if (adminVerified) {
      log('✅ Admin status detected on group page.');
    } else {
      warn('Admin status not detected on this group page (scraping continues as member/visitor).');
    }

    // Scroll to trigger lazy loading of posts
    log('Scrolling feed for lazy loaded posts...');
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 1.5));
      await page.waitForTimeout(1000 + Math.random() * 1000); // Anti-ban jitter
    }

    let postElements = await page.$$('div[role="feed"] div[role="article"]');
    if (postElements.length === 0) {
      postElements = await page.$$('div[role="article"]');
    }
    if (postElements.length === 0) {
      postElements = await page.$$('div[data-ad-preview="message"]');
    }
    log(`Found ${postElements.length} post containers.`);

    for (const element of postElements.slice(0, maxPosts)) {
      try {
        const rawText = await element.evaluate((el: any) => {
          const msgEl = el.querySelector('[data-ad-preview="message"], [data-testid="post_message"], div[dir="auto"]');
          return msgEl ? msgEl.textContent : el.textContent || '';
        });

        // No keyword filter. It used to drop any post missing one of a hardcoded
        // word list ('sell', 'price', 'car'…), so a listing phrased differently
        // never reached the moderation queue at all. Deciding that is the
        // operator's job, not a substring match's.

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

        // Identity must be stable across syncs — `fbPostId` is the upsert key.
        // Prefer the real permalink; fall back to a hash of the post text
        // scoped to the group.
        const permalink = await element.evaluate((el: any) => {
          const anchor = el.querySelector(
            'a[href*="/posts/"], a[href*="permalink"], a[href*="story_fbid"], a[href*="multi_permalinks"]'
          );
          const href = anchor?.getAttribute('href');
          if (!href) return '';
          try {
            const url = new URL(href, 'https://www.facebook.com');
            return `${url.origin}${url.pathname}`;
          } catch {
            return '';
          }
        });

        const postUrlId =
          permalink ||
          `fb-${group.id}-${createHash('sha1').update(rawText.trim()).digest('hex').substring(0, 16)}`;

        posts.push({
          id: postUrlId,
          text: rawText.trim(),
          images: [...new Set(imageUrls)],
          author: 'Facebook User',
          title: rawText.split('\n')[0].substring(0, 100)
        });
      } catch (postError: any) {
        error(`Error parsing individual post: ${postError?.message || postError}`);
      }
    }

    return { posts, containersFound: postElements.length, adminVerified };
  } finally {
    if (browser) {
      log('Closing browser session...');
      await browser.close();
    }
  }
}
