#!/usr/bin/env node
// Packages browser-extension/ into apps/web/public so the app can serve it.
//
// Generated at build time rather than committed: a stale zip that silently
// disagrees with the source is worse than no zip, and this way the download is
// always the extension that is actually in the repo.

import AdmZip from 'adm-zip';
import { existsSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = resolve(ROOT, 'browser-extension');
const OUT_DIR = resolve(ROOT, 'apps/web/public');
const OUT_FILE = resolve(OUT_DIR, 'groupmarket-connector.zip');

if (!existsSync(SOURCE)) {
  // Don't fail the build over a missing optional asset — the page handles it.
  console.warn(`[extension-zip] ${SOURCE} not found, skipping.`);
  process.exit(0);
}

mkdirSync(OUT_DIR, { recursive: true });

const zip = new AdmZip();
// Zipped without a wrapping folder: Chrome's "Load unpacked" wants the folder
// containing manifest.json, so the user unzips and selects that directly.
zip.addLocalFolder(SOURCE);
zip.writeZip(OUT_FILE);

console.log(`[extension-zip] Wrote ${OUT_FILE} (${statSync(OUT_FILE).size} bytes)`);
