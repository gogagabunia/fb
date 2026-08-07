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
| `apps/mobile` | Expo client (unmaintained; points at `localhost:3000`) |
| `*.html`, `vite.config.js` | Pre-Next static prototype, superseded by `apps/web` |

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
carry the same build command and the daily `/api/cron/scrape` schedule, so the
cron registers whichever directory the Vercel project is rooted at. Keep them in
sync when changing either.

## Known gaps

- No test suite and no CI.
- `apps/web/next.config.mjs` sets `ignoreBuildErrors` and `ignoreDuringBuilds`,
  so TypeScript and ESLint failures do not block a deploy.
- The login rate limiter (`app/lib/rate-limiter.ts`) is in-process, so on
  serverless it limits per instance rather than per account.
- Analytics event recording is unauthenticated by design (visitors are
  anonymous); preventing count inflation needs IP throttling at the edge.
- Scraping Facebook with a member's session cookies is against Facebook's terms
  of service and can get the connected account restricted.
