import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
const OUT = '/tmp/cr-snap3';
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
  colorScheme: 'dark',
});
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
await page.evaluate(() => {
  localStorage.setItem('cr:address', JSON.stringify({ streetId: 1265, street: 'Dacia', number: 42, sector: 1, buildingType: 'case' }));
  localStorage.setItem('cr:tour-seen', '1');
  localStorage.setItem('cr:theme', 'dark');
});
await page.reload({ waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

await page.getByRole('button', { name: /ce date avem/i }).scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /ce date avem/i }).click();
await page.waitForTimeout(500);
const coverage = page.locator('section').filter({ hasText: /Ce date avem pentru Sectorul/i }).first();
await coverage.screenshot({ path: `${OUT}/coverage-dark.png` });

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(300);
await page.getByRole('button', { name: /ghid complet/i }).click();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/guide-dark.png` });
const bateriiBtn = page.locator('article').filter({ hasText: /Baterii/i }).locator('button').first();
if (await bateriiBtn.count() > 0) {
  await bateriiBtn.click();
  await page.waitForTimeout(400);
  await bateriiBtn.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${OUT}/guide-baterii-dark.png` });
}

// waste infohint in dark mode
await page.keyboard.press('Escape');
await page.waitForTimeout(400);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const scoatemInfo = page.locator('[data-tour="waste"]').locator('button[aria-label="Mai multe informații"]');
if (await scoatemInfo.count() > 0) {
  await scoatemInfo.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/waste-infohint-dark.png`, fullPage: false });
}

await ctx.close();
await b.close();
console.log('done');
