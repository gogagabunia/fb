#!/usr/bin/env node
// Local Postgres for GroupMarket dev — no Docker, no system Postgres.
// Downloads a real Postgres server (embedded-postgres) into .local-db/ on first run.
//
//   node .claude/skills/run-groupmarket/local-db.mjs start   # start + write env files (STAYS RUNNING)
//   node .claude/skills/run-groupmarket/local-db.mjs stop
//   node .claude/skills/run-groupmarket/local-db.mjs status
//
// `start` blocks — the postmaster is a child of this process and dies with it,
// so run it in the background and leave it running for the whole session.

import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import net from 'node:net';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DATA_DIR = resolve(ROOT, '.local-db');
const PORT = 54329;
const DB_NAME = 'groupmarket';
const URL = `postgresql://postgres:postgres@localhost:${PORT}/${DB_NAME}`;

const pg = () =>
  new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: 'postgres',
    password: 'postgres',
    port: PORT,
    persistent: true,
    // Force a UTF8, locale-independent cluster. Without this, initdb picks up
    // the Windows system locale (WIN1252) and emoji in scraped posts fail with
    // "character ... has no equivalent in encoding WIN1252".
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
  });

const isUp = () =>
  new Promise((res) => {
    const s = net.connect(PORT, '127.0.0.1');
    s.on('connect', () => (s.destroy(), res(true)));
    s.on('error', () => res(false));
    setTimeout(() => (s.destroy(), res(false)), 1500);
  });

// Both files are gitignored. Next.js only reads apps/web/.env.local; the
// Prisma CLI (run from the repo root) only reads the root .env. Hence both.
function writeEnvFiles() {
  const env = [
    `POSTGRES_PRISMA_URL="${URL}"`,
    `POSTGRES_URL_NON_POOLING="${URL}"`,
    `JWT_SECRET="local-dev-secret-not-for-production"`,
    `NEXT_PUBLIC_APP_URL="http://localhost:3000"`,
    `ADMIN_EMAIL="admin@groupmarket.local"`,
    `CRON_SECRET="local-dev-cron-secret"`,
    '',
  ].join('\n');
  writeFileSync(resolve(ROOT, '.env'), env);
  mkdirSync(resolve(ROOT, 'apps/web'), { recursive: true });
  writeFileSync(resolve(ROOT, 'apps/web/.env.local'), env);
  console.log('wrote .env and apps/web/.env.local');
}

const cmd = process.argv[2] ?? 'start';

if (cmd === 'start') {
  if (await isUp()) {
    console.log(`already running on ${PORT}`);
    writeEnvFiles();
    process.exit(0);
  }
  const db = pg();
  if (!existsSync(DATA_DIR)) {
    console.log('initialising cluster (first run downloads Postgres)...');
    await db.initialise();
  }
  await db.start();
  try {
    await db.createDatabase(DB_NAME);
    console.log(`created database ${DB_NAME}`);
  } catch {
    console.log(`database ${DB_NAME} already exists`);
  }
  writeEnvFiles();
  console.log(`postgres up: ${URL}`);
  console.log('DB_READY'); // marker to wait on
  console.log('leave this process running; Ctrl-C or `local-db.mjs stop` to shut down');

  const shutdown = async () => {
    try {
      await db.stop();
      console.log('postgres stopped');
    } catch {}
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  await new Promise(() => {}); // block forever
}

if (cmd === 'stop') {
  if (!(await isUp())) {
    console.log('not running');
    process.exit(0);
  }
  // NOT EmbeddedPostgres#stop() — it guards on `this.process`, so from a
  // different process than `start` it returns silently and stops nothing.
  // Drive the shipped pg_ctl against the data dir instead.
  const pgCtl = resolve(
    ROOT,
    'node_modules/@embedded-postgres/windows-x64/native/bin/pg_ctl.exe'
  );
  if (!existsSync(pgCtl)) {
    console.error(`pg_ctl not found at ${pgCtl} (non-Windows host? run npm install)`);
    process.exit(1);
  }
  const r = spawnSync(pgCtl, ['-D', DATA_DIR, '-m', 'fast', 'stop'], { encoding: 'utf8' });
  process.stdout.write(r.stdout ?? '');
  process.stderr.write(r.stderr ?? '');
  await new Promise((res) => setTimeout(res, 1500));
  console.log((await isUp()) ? 'WARNING: still up on ' + PORT : 'postgres stopped');
  process.exit(0);
}

if (cmd === 'status') {
  console.log((await isUp()) ? `up on ${PORT}` : 'down');
  process.exit(0);
}

console.error(`unknown command: ${cmd} (use start|stop|status)`);
process.exit(1);
