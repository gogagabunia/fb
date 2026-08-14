import { execSync } from 'node:child_process';

/**
 * Apply the Prisma schema to the database as part of the deploy build — but
 * only where a real database is actually reachable.
 *
 * Vercel sets VERCEL=1 for every build and injects the production connection
 * strings, so a `db push` there keeps the live schema in sync on each deploy
 * with no separate migration step. CI (GitHub Actions) builds the app with a
 * placeholder localhost database URL and no server running, purely to catch
 * compile/type errors; pushing there would fail with P1001 for no reason. So
 * gate on VERCEL: sync on deploy, skip everywhere else.
 */
if (!process.env.VERCEL) {
  console.log('[db-push] Not a Vercel deploy build — skipping prisma db push.');
  process.exit(0);
}

console.log('[db-push] Applying Prisma schema to the database…');
execSync('npx prisma db push --schema=../../packages/database/prisma/schema.prisma --skip-generate', {
  stdio: 'inherit',
});
