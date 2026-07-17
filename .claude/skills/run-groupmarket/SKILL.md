---
name: run-groupmarket
description: Build, run, screenshot, and drive the GroupMarket web app (Next.js) locally, including a zero-install local Postgres and seed data. Use when asked to run/start/launch/serve the app or dev server, take a screenshot of a page, reproduce a UI bug, or verify a change in the real running app.
---

# Run GroupMarket

Next.js 15 app (`apps/web`) + Prisma/Postgres (`packages/database`). Facebook group posts get
scraped, parsed by AI, and published as marketplace listings.

**All paths below are relative to the repo root** (the directory holding `package.json` with
`workspaces`). Verified on Windows 11, Node v24.13.0, npm 11.10.1.

The app **cannot serve real data without Postgres** — pages return HTTP 200 but every DB route
500s with `Environment variable not found: POSTGRES_PRISMA_URL`. There is no Docker or system
Postgres on this machine, so this skill runs a real Postgres 18 downloaded by
`embedded-postgres` into `.local-db/`. No Docker, no install, no cloud database.

Three processes: **DB daemon** → **dev server** → **driver** (Playwright).

## Setup (once)

```bash
npm install                                                             # root; npm workspaces
npx prisma generate --schema=packages/database/prisma/schema.prisma
npx playwright install chromium                                          # driver needs the binary
```

## Run

### 1. Start the database — must stay running

```bash
node .claude/skills/run-groupmarket/local-db.mjs start
```

**This blocks and must be left running in the background.** The postmaster is a child of this
process and dies with it. It prints `DB_READY`, then writes `.env` and `apps/web/.env.local`
(both gitignored) with the DB URL, `JWT_SECRET`, and the rest. First run downloads Postgres
(~30s); later runs take ~2s.

`... local-db.mjs status` → `up on 54329` / `down`. `... local-db.mjs stop` shuts it down.

### 2. Create the schema and seed data (once per fresh DB)

```bash
npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate
node --env-file=.env .claude/skills/run-groupmarket/seed.mjs
```

Seeds 3 listings, 1 pending post, and an admin: **admin@groupmarket.local / password123**.
Idempotent — re-run freely. `--skip-generate` matters, see Gotchas.

### 3. Start the dev server

```bash
cd apps/web && npm run dev        # http://localhost:3000, ready in ~2s
```

Root `npm run dev` (`turbo run dev`) **does not work** — there is no `turbo.json`.

### 4. Drive it (agent path)

```bash
node .claude/skills/run-groupmarket/driver.mjs smoke            # public pages + assert seeded data
node .claude/skills/run-groupmarket/driver.mjs login            # log in -> /dashboard
node .claude/skills/run-groupmarket/driver.mjs shot /marketplace mkt
```

Screenshots land in `.screenshots/` (gitignored). **Look at them** — a broken page still
screenshots at HTTP 200. The driver reports console errors and any 5xx it sees.

Verified `smoke` output:

```
/ -> HTTP 200
/marketplace -> HTTP 200
/login -> HTTP 200
seeded listings visible: 3/3 ["Camry","MacBook","Oak dining table"]
/api/listings returned 3 rows
```

`login` lands on `http://localhost:3000/dashboard`, showing Connected Groups 1, Pending
Reviews 1, Live Listings 3.

### Human path

`cd apps/web && npm run dev`, open http://localhost:3000, Ctrl-C to stop. Steps 1–2 are still
required or every data page is empty/500.

## Gotchas

- **`local-db.mjs start` must keep running.** Postgres dies with its parent. (An earlier
  variant that exited after `start()` left an *orphan* postmaster whose port stayed LISTENING
  under a dead PID — if `status` says `up` but nothing works, see Troubleshooting.)
- **Never call `EmbeddedPostgres#stop()` from a process that didn't call `start()`.** It guards
  on `this.process`, so it resolves and logs success having stopped *nothing*. `local-db.mjs
  stop` drives the shipped `pg_ctl.exe` against the data dir instead, and re-checks the port
  afterwards. If you write your own DB tooling here, do the same.
- **`prisma db push` without `--skip-generate` fails while the dev server is running**:
  `EPERM: operation not permitted, rename ...query_engine-windows.dll.node`. The server holds
  the engine DLL open. Use `--skip-generate`, or stop the server first.
- **Next.js hot-reloads `.env.local`** — start the DB after the dev server and it still picks
  the env up, no restart needed. Look for `- Environments: .env.local` in its output.
- **Stopping the dev server needs a real kill.** Killing the shell that ran `npm run dev`
  leaves the Node process holding :3000, and the next start dies with `EADDRINUSE`.
- **Seeded listings show identical stock photos.** The seed sets `images: []` and the UI falls
  back to a placeholder. Not a bug.
- **`/dashboard` may log `Failed to get dashboard stats: TypeError: Failed to fetch`** in the
  console right after login — a server action aborted by the navigation. The stats render
  anyway. Ignore it unless the tiles are actually empty.
- **Only `apps/web` runs.** `apps/api/src` is imported *as source* by `apps/web/app/actions.ts`;
  it is not a standalone service. `apps/mobile` (Expo) is separate and untested here.
- **`.env` and `apps/web/.env.local` are both generated** — Next reads only the latter, the
  Prisma CLI (from the root) reads only the former.
- Scraping/AI/payment paths need real `OPENAI_API_KEY` / `STRIPE_SECRET_KEY` / SMTP creds.
  Unset locally, so those flows fail. Browsing, auth, dashboard, and moderation work fully.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Environment variable not found: POSTGRES_PRISMA_URL` | DB daemon not running, or env files missing. Run step 1. |
| `status` says `up` but Prisma can't connect | Orphan postmaster. PowerShell: `Stop-Process -Name postgres -Force`, then step 1. |
| `EADDRINUSE: :::3000` | PowerShell: `Get-NetTCPConnection -LocalPort 3000 -State Listen \| %{ Stop-Process -Id $_.OwningProcess -Force }` |
| `EPERM ... query_engine-windows.dll.node` | Add `--skip-generate` (see Gotchas). |
| `browserType.launch: Executable doesn't exist` | `npx playwright install chromium` |
| `seeded listings visible: 0/3` | DB up but not seeded — run step 2. |
| Root `npm run dev` does nothing useful | No `turbo.json`; use `cd apps/web && npm run dev`. |
