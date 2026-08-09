# GroupMarket

Imports posts from Facebook groups, extracts classified-ad details with an LLM,
and publishes approved items as marketplace listings after human moderation.

## Roles

Three kinds of account, chosen on the register form (`ADMIN_EMAIL` overrides):

| Area | Public | BUYER | SELLER | ADMIN |
| --- | --- | --- | --- | --- |
| Homepage, categories, listing pages | ✔ | ✔ | ✔ | ✔ |
| Favorites | — | ✔ | ✔ | ✔ |
| Dashboard, groups, moderation, connect Facebook | — | — | own only | all |
| Admin panel (`/admin`): users & roles, all listings, all queues | — | — | — | ✔ |

Rules live in one file — `apps/web/app/lib/authz.ts` maps roles to
capabilities, and every protected server action asks `requireCapability(...)`,
which reads the role from the database per call (promotions apply without
re-login). Nothing else compares roles.

Buyers cannot self-upgrade; the admin changes roles in `/admin` → Users. Sync
only runs for groups whose owner is a SELLER or ADMIN — a demoted seller's
pipeline stops everywhere at once, reported as `skippedOwnerNotSeller` in the
cron telemetry.

Categories are a fixed list in `apps/web/app/lib/categories.ts` (15 entries,
ending in Other). The moderation form is a dropdown of exactly this list, the
AI parser's guess pre-selects it (stored on `ImportedPost.parsedCategory`),
and approval rejects anything not on the list. The homepage renders the same
list with live counts.

### Migrating an existing deployment to roles

One-time, in this order:

1. Merge and let Vercel deploy.
2. Run `scripts/reset-and-migrate-roles.sql` in the Neon console — **deletes
   all data** (the owner asked for a clean slate) and converts the Role enum.
   Registration errors in the minutes between deploy and SQL; that window ends
   when both are done.
3. Set `ADMIN_EMAIL` in Vercel and redeploy.
4. Register with that email → the account is ADMIN. Re-add groups and
   reconnect Facebook from `/connect-facebook`.

## Layout

| Path | What it is |
| --- | --- |
| `apps/web` | The application — Next.js 15, React 19, Tailwind, Prisma |
| `apps/api/src` | Scraper + AI parser services, imported directly by `apps/web` |
| `packages/database` | Prisma schema and generated client |
| `browser-extension` | Chrome MV3 extension for one-click Facebook connect |

## Setup

```bash
npm install
npm run db:generate                 # prisma generate
npm run db:migrate                  # prisma db push
npm run dev                         # turbo run dev → app on :3000
```

## Environment

**Required in production — the app refuses to boot without them.** Both had
built-in fallback constants, which meant a deploy that forgot to set them ran
with a publicly-known signing key.

| Variable | Purpose |
| --- | --- |
| `JWT_SECRET` | Signs session cookies. A leak means forgeable logins. |
| `ENCRYPTION_KEY` | AES-256-GCM key for stored Facebook cookies. |
| `POSTGRES_PRISMA_URL` | Pooled Postgres connection string. |
| `POSTGRES_URL_NON_POOLING` | Direct connection, used for migrations. |

Generate the secrets with `openssl rand -base64 48`.

**Optional.** Absent keys degrade gracefully rather than failing.

| Variable | Effect when unset |
| --- | --- |
| `APIFY_API_TOKEN` | Falls back to the local Playwright scraper. |
| `APIFY_PROXY_URL` | **Scrapes return nothing.** Apify runs on datacenter IPs and Facebook blocks those, so the actor is shown a login wall however valid the session is. See below. |
| `FB_COOKIES` | Shared Facebook session; per-owner sessions are used first. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` | Parser falls through Gemini → Groq → OpenAI → local regex heuristics. |
| `STRIPE_SECRET_KEY` | Listing promotion returns 503 (`Payments are not configured`). |
| `STRIPE_WEBHOOK_SECRET` | Required alongside the Stripe key — promotions are applied by the webhook, not at checkout. |
| `BLOB_READ_WRITE_TOKEN` | Listing images keep pointing at Facebook CDN URLs, which expire — published listings lose their photos after a few days. Set it (Vercel → Storage → Blob) to copy images into permanent storage at import. |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Moderation alerts log to stdout instead of sending. |
| `CRON_SECRET` | Checked as `Authorization: Bearer …` on `/api/cron/scrape` in production. |
| `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000` in links and redirects. |
| `SYNC_MAX_POSTS` | How many recent posts each sync pulls per group. Defaults to 5. |
| `SYNC_SINCE_DAYS` | Date window in days; defaults to 0, meaning no window — just the most recent posts. |
| `SYNC_REQUIRE_IMAGES` | `false` imports text-only posts too. On by default, so a post with no photo never reaches the queue. |
| `ADMIN_EMAIL` | Registration with this email (case-insensitive) gets the ADMIN role. An already-existing account with this email is also promoted to ADMIN on its next login, so setting the variable after the fact needs no database edit. Only ever promotes — clearing or changing it never demotes. Unset → nobody is auto-promoted. |
| `USE_MOCK_SCRAPER` | `true` returns canned posts when a scrape fails. |
| `ALLOW_SIMULATED_CHECKOUT` | `true` grants promotions without payment. Development only — ignored when `NODE_ENV=production`. |

## Stripe promotions

`POST /api/checkout` only creates a Checkout session. The listing is marked
featured by `POST /api/stripe/webhook` once Stripe confirms payment, so the
webhook must be registered for `checkout.session.completed` and
`STRIPE_WEBHOOK_SECRET` must be set. Promotions run for 7 days and expire on
read via `featuredUntil`.

## Deployment

Deployed on Vercel. Both `vercel.json` (repo root) and `apps/web/vercel.json`
carry the same build command and the `/api/cron/scrape` schedule, so the cron
registers whichever directory the Vercel project is rooted at. Keep them in sync
when changing either.

### Scrape frequency

`vercel.json` is on `0 6 * * *` — once a day — and must stay there while the
project is on the Hobby plan. Vercel does not quietly downgrade a more frequent
expression: it **rejects the deployment**, with
`Hobby accounts are limited to daily cron jobs`.

To sync more often without upgrading, `.github/workflows/scrape.yml` calls
`POST /api/cron/scrape` every six hours with the same `CRON_SECRET` the route
already checks. It needs two repository secrets, `APP_URL` and `CRON_SECRET`,
and skips silently when either is missing. On Pro, raise the `vercel.json`
schedule instead and disable that workflow.

The route sets `maxDuration = 60`, the Hobby ceiling; on Pro it can be raised,
which matters because each run parses posts through an LLM (see
`PARSE_BUDGET_MS` in `app/lib/sync.ts`, currently 35s per group).

Frequency costs real money either way: every run triggers an Apify actor run per
active group and one LLM call per candidate post.

### Which groups a run reaches

An Apify run takes roughly 28s even when it returns nothing, so a 50s request
fits one group, occasionally two. Groups are therefore synced
least-recently-first, ordered by `FacebookGroup.lastSyncedAt`, and each run
reports `groupsNotAttempted` for the ones it could not reach.

`lastSyncedAt` is stamped when the attempt *starts*, not when it succeeds — a
group that always fails still rotates to the back instead of monopolising every
run. With N groups, expect a full cycle every N runs.

Images are copied into blob storage at import time, so listings keep their
photos after Facebook's CDN URLs expire — set `BLOB_READ_WRITE_TOKEN` to enable
it (see the environment table above).

## Tests

```bash
npm test          # vitest, once
npm run test:watch
```

Covers the pure logic: model-output validation, promotion expiry, the bounded
parser concurrency, HTML escaping, and image storage fallbacks. CI
(`.github/workflows/ci.yml`) runs install → prisma generate → schema validate →
test → typecheck → build on every push to `main` and every PR.

Database-backed flows are not covered by automated tests. To exercise them, use
`.claude/skills/run-groupmarket` — it runs a real Postgres locally, seeds data,
and drives the app with Playwright.

## Diagnosing an empty sync

A sync needs a Facebook session — the Apify actor cannot read *any* group
without one, public or private. If none is attached the sync refuses with
`needsFacebook` rather than scraping and quietly returning nothing.

Every sync result carries a `diagnostics` block, surfaced in the cron's
telemetry:

| Field | Tells you |
| --- | --- |
| `usedSession` | `owner`, `shared` or `none` |
| `groupUrl` | the URL actually scraped — catches a group saved with a bad link |
| `postsReturnedByScraper` | raw rows from the scraper, before any filtering |
| `apify` | the run's id, final status, dataset size, and log tail |
| `hint` | plain-language reading when the count is zero |

Group URLs should look like `https://www.facebook.com/groups/<id>`. A profile
link or a search URL returns nothing with no error.

### A session is not enough — the run also needs a proxy

Apify's actors run on datacenter IPs, and Facebook blocks those aggressively. A
production run with a valid connected session read zero posts and its log said
why:

```
[MAIN] Starting: ... cookies=10 cookies
[PROXY] No proxy configured. Facebook blocks datacenter IPs
[SCRAPER] Injecting 10 cookies for authenticated access
[SCRAPER] Login prompt detected, but cookies are present
[MAIN] Total posts scraped: 0
```

The cookies arrived and were injected. Facebook served a login wall anyway,
because of where the request came from. `APIFY_PROXY_URL` is passed to the actor
as `proxyUrl`; any residential proxy works, and Apify's own looks like:

```
http://groups-RESIDENTIAL:<APIFY_PROXY_PASSWORD>@proxy.apify.com:8000
```

Set the **value** to the URL alone. Pasting the whole `APIFY_PROXY_URL = …`
line into the value box failed every run with `Expected property string values
to be a URL` — that prefix, and surrounding quotes, are now stripped, but a
value that still isn't an `http(s)` URL stops the sync before any actor run
starts rather than failing once per group.

Residential proxy is billed per GB and is not on the free plan. Until the
variable is set, every sync logs a warning up front and any empty result says
so in its `hint` — the missing proxy is reported ahead of the session, because
it blocks the request before Facebook ever looks at the cookies.

### Reading the `apify` block

The scrape used to call `run-sync-get-dataset-items`, which returns the dataset
rows and nothing else — so a run that failed, timed out, or hit a login wall was
indistinguishable from a group that genuinely had no posts. All three arrived as
`[]` and were reported as a success with zero posts.

The run is now started explicitly and waited on, which costs one extra request
and gives back what actually happened:

- **status not `SUCCEEDED`** — the sync fails with the run's status and status
  message rather than reporting an empty success. A run still going when the
  budget runs out is aborted, so it stops billing.
- **`SUCCEEDED` with `itemCount: 0`** — the actor ran fine and found nothing.
  `logTail` carries the end of the actor's own log, which is the only place the
  reason appears: a login redirect, a blocked proxy, or an empty group.

Session cookies are stripped from `logTail` before it is stored or logged —
actors echo their input on startup, and this text reaches cron telemetry and CI
logs.

Owners connect a session from `/connect-facebook`, which serves the browser
extension and its install steps.

## What reaches the moderation queue

Three rules run in order, before the parser, and each one is counted so a run
that imports nothing can say which rule dropped what:

| Rule | Reported as |
| --- | --- |
| Has text at all | `postsSkippedNoText` — nothing to parse or judge |
| Has at least one image | `postsWithoutImages` |
| Not already imported | `postsDuplicate` |

Anything surviving all three is imported as `PENDING`.

**Duplicates are dropped before parsing, not after.** The check used to sit
after the AI call, so every already-seen post was re-parsed on every sync and
the result discarded a few lines later — with 5 posts per group, 5 groups and
4 syncs a day, nearly every one of those calls was waste.

**The image rule discards real listings.** A text-only "selling my sofa, message
me" is a genuine ad that will never reach the queue. Set
`SYNC_REQUIRE_IMAGES=false` to take everything with text instead.

Two *other* filters used to sit in front of the queue and both were removed: the
AI's `isListing` verdict, which silently discarded any post it misjudged, and a
hardcoded keyword list (`sell`, `price`, `car`…) on the browser scraper, which
dropped listings phrased differently. The parser still runs — its output
prefills the moderation form — but it no longer decides what gets imported.

`FacebookGroup.keywords` is still collected by the connect form and stored, but
nothing reads it any more.

## Known gaps

- No automated coverage of the database-backed paths (moderation, sync,
  checkout) — only the pure logic above.
- ESLint is not configured, so `ignoreDuringBuilds` stays on in
  `next.config.mjs`. TypeScript errors *do* block the build.
- The login rate limiter (`app/lib/rate-limiter.ts`) is in-process, so on
  serverless it limits per instance rather than per account.
- Analytics event recording is unauthenticated by design (visitors are
  anonymous); preventing count inflation needs IP throttling at the edge.
- Scraping Facebook with a member's session cookies is against Facebook's terms
  of service and can get the connected account restricted.
