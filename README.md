# GroupMarket

Imports posts from Facebook groups, extracts classified-ad details with an LLM,
and publishes approved items as marketplace listings after human moderation.

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
| `FB_COOKIES` | Shared Facebook session; per-owner sessions are used first. |
| `GEMINI_API_KEY` / `GROQ_API_KEY` / `OPENAI_API_KEY` | Parser falls through Gemini → Groq → OpenAI → local regex heuristics. |
| `STRIPE_SECRET_KEY` | Listing promotion returns 503 (`Payments are not configured`). |
| `STRIPE_WEBHOOK_SECRET` | Required alongside the Stripe key — promotions are applied by the webhook, not at checkout. |
| `BLOB_READ_WRITE_TOKEN` | Listing images keep pointing at Facebook CDN URLs, which expire — published listings lose their photos after a few days. Set it (Vercel → Storage → Blob) to copy images into permanent storage at import. |
| `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` | Moderation alerts log to stdout instead of sending. |
| `CRON_SECRET` | Checked as `Authorization: Bearer …` on `/api/cron/scrape` in production. |
| `NEXT_PUBLIC_APP_URL` | Defaults to `http://localhost:3000` in links and redirects. |
| `SYNC_TEST_MODE` | `true` limits syncs to 5 posts with no date window. |
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

The schedule is `0 */6 * * *` — every six hours.

**On the Hobby plan Vercel runs cron jobs once per day regardless of the
expression**, so this only takes effect on Pro. The route also sets
`maxDuration = 60`, the Hobby ceiling; on Pro it can be raised, which matters
because each run parses posts through an LLM (see `PARSE_BUDGET_MS` in
`app/lib/sync.ts`, currently 35s per group).

Raising frequency costs real money: every run triggers an Apify actor run per
active group and one LLM call per candidate post. Weigh that before going below
six hours.

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
