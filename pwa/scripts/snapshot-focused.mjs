// Targeted snapshots for reported issues
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-snap3';
await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem(
    'cr:address',
    JSON.stringify({ streetId: 1265, street: 'Dacia', number: 42, sector: 1, buildingType: 'case' }),
  );
  localStorage.setItem('cr:tour-seen', '1');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// Issue 1: InfoHint on "scoatem menajer" — z-index problem
// The waste pill InfoHint is the second info button (first is building type)
const info = page.locator('button[aria-label="Mai multe informații"]');
const count = await info.count();
console.log('info buttons:', count);
// Find the one inside waste card — it's near the "scoatem" text
const scoatemInfo = page.locator('[data-tour="waste"]').locator('button[aria-label="Mai multe informații"]');
if (await scoatemInfo.count() > 0) {
  await scoatemInfo.click();
  await page.waitForTimeout(500);
  // Full page screenshot
  await page.screenshot({ path: `${OUT}/waste-infohint-open.png`, fullPage: false });
  console.log('  ✓ waste-infohint-open.png');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

// Issue 2: Coverage section background/text contrast
const coverage = page.locator('section').filter({ hasText: /Ce date avem pentru Sectorul/i }).first();
if (await coverage.count() > 0) {
  await coverage.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await coverage.screenshot({ path: `${OUT}/coverage-collapsed.png` });
  console.log('  ✓ coverage-collapsed.png');
  // Click to expand
  await page.getByRole('button', { name: /ce date avem/i }).click();
  await page.waitForTimeout(400);
  await coverage.screenshot({ path: `${OUT}/coverage-expanded.png` });
  console.log('  ✓ coverage-expanded.png');
}

// Issue 3: Guide sheet — white bg with light text
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.getByRole('button', { name: /ghid complet/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/guide-open.png` });
console.log('  ✓ guide-open.png');
// Expand first
await page.locator('article button').first().click();
await page.waitForTimeout(400);
await page.screenshot({ path: `${OUT}/guide-expanded.png` });
console.log('  ✓ guide-expanded.png');
// Zoom in to a card with disposal points
await page.keyboard.press('Escape');
await page.waitForTimeout(300);
await page.getByRole('button', { name: /ghid complet/i }).click();
await page.waitForTimeout(600);
// Expand "baterii" card (has disposal)
const bateriiBtn = page.locator('article').filter({ hasText: /Baterii/i }).locator('button').first();
if (await bateriiBtn.count() > 0) {
  await bateriiBtn.click();
  await page.waitForTimeout(400);
  await bateriiBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/guide-baterii.png` });
  console.log('  ✓ guide-baterii.png');
}

await ctx.close();
await browser.close();
console.log('✅ done');
