#!/usr/bin/env node
// Drive the running GroupMarket web app in a real browser and screenshot it.
// Requires the dev server on :3000 and the local DB to be up (see SKILL.md).
//
//   node .claude/skills/run-groupmarket/driver.mjs smoke          # all public pages
//   node .claude/skills/run-groupmarket/driver.mjs login          # log in, hit /dashboard
//   node .claude/skills/run-groupmarket/driver.mjs shot /marketplace mkt
//
// Screenshots land in .screenshots/ (gitignored). LOOK AT THEM — a page that
// 500s still screenshots fine, it just shows an error.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const SHOTS = resolve(ROOT, '.screenshots');
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const CREDS = { email: 'admin@groupmarket.local', password: 'password123' };

mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const problems = [];
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));
page.on('response', (r) => r.status() >= 500 && problems.push(`HTTP ${r.status()} ${r.url()}`));

async function go(path) {
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return res?.status() ?? 0;
}

async function shot(name) {
  const file = resolve(SHOTS, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function login() {
  await go('/login');
  await page.fill('input[type="email"]', CREDS.email);
  await page.fill('input[type="password"]', CREDS.password);
  await Promise.all([
    page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  return page.url();
}

const cmd = process.argv[2] ?? 'smoke';

if (cmd === 'shot') {
  const path = process.argv[3] ?? '/';
  const name = process.argv[4] ?? 'shot';
  console.log(`${path} -> HTTP ${await go(path)}`);
  console.log(`screenshot: ${await shot(name)}`);
}

if (cmd === 'login') {
  const landed = await login();
  console.log(`after login: ${landed}`);
  console.log(`screenshot: ${await shot('after-login')}`);
  console.log(`/dashboard -> HTTP ${await go('/dashboard')}`);
  console.log(`screenshot: ${await shot('dashboard')}`);
}

if (cmd === 'smoke') {
  for (const [path, name] of [
    ['/', 'home'],
    ['/marketplace', 'marketplace'],
    ['/login', 'login'],
  ]) {
    console.log(`${path} -> HTTP ${await go(path)}`);
    console.log(`  screenshot: ${await shot(name)}`);
  }

  // The marketplace renders listings client-side via a server action, so assert
  // on real seeded text rather than the HTTP status.
  await go('/marketplace');
  await page.waitForTimeout(1500);
  const body = await page.textContent('body');
  const seeded = ['Camry', 'MacBook', 'Oak dining table'].filter((t) => body.includes(t));
  console.log(`seeded listings visible: ${seeded.length}/3 ${JSON.stringify(seeded)}`);
  if (seeded.length === 0) console.log('  (DB up and seeded? see SKILL.md)');

  const api = await (await page.request.get(`${BASE}/api/listings`)).json();
  console.log(`/api/listings returned ${Array.isArray(api) ? api.length : 'ERROR'} rows`);
}

if (problems.length) {
  console.log('\nproblems observed:');
  for (const p of [...new Set(problems)].slice(0, 10)) console.log(`  ${p}`);
}

await browser.close();
