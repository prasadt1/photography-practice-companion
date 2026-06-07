#!/usr/bin/env node
/**
 * Capture top-of-page hero from bundled Iris landing (docs/index.html).
 *
 * Usage (from repo root):
 *   node scripts/capture-landing-hero.mjs
 *
 * Requires: npm install in docs/devpost-assets (playwright).
 */

import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LANDING = path.join(ROOT, 'docs/index.html');
const OUT = path.join(ROOT, 'docs/devpost-public/iris-landing-hero.png');
const WIDTH = 1280;
const HEIGHT = 900;

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: WIDTH, height: HEIGHT });

await page.goto(`file://${LANDING}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });

await page.waitForFunction(
  () => document.querySelector('.hero') || document.querySelector('header .btn-primary'),
  { timeout: 60_000 },
);
await page.waitForTimeout(800);

const loading = page.locator('#__bundler_loading');
if (await loading.isVisible().catch(() => false)) {
  await loading.waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});
}

await page.screenshot({
  path: OUT,
  clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
});

await browser.close();

const { statSync } = await import('node:fs');
const st = statSync(OUT);
console.log(`✓ ${OUT}`);
console.log(`  dimensions: ${WIDTH}×${HEIGHT}, ${st.size} bytes`);
