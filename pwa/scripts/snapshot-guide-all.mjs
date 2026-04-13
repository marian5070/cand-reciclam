// Expand EVERY guide category, take screenshot of each + viewport crop
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-guide';
await mkdir(OUT, { recursive: true });

const b = await chromium.launch({ headless: true });

async function run(colorScheme) {
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 1200 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
    colorScheme,
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
  await page.evaluate((scheme) => {
    localStorage.setItem(
      'cr:address',
      JSON.stringify({ streetId: 1265, street: 'Dacia', number: 36, sector: 1, buildingType: 'case' }),
    );
    localStorage.setItem('cr:tour-seen', '1');
    localStorage.setItem('cr:theme', scheme);
  }, colorScheme);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Open guide
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /ghid complet/i }).click();
  await page.waitForTimeout(700);

  // Iterate all guide cards via data-testid — scoped to avoid matching Timeline articles
  const cardCount = await page.locator('[data-testid="guide-card"]').count();
  console.log(`[${colorScheme}] ${cardCount} cards`);
  for (let i = 0; i < cardCount; i++) {
    const card = page.locator('[data-testid="guide-card"]').nth(i);
    const btn = card.locator('button').first();
    let title = `card-${i}`;
    try {
      title = (await card.locator('h3').textContent())?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') ?? title;
    } catch {}
    // Scroll it into view inside the modal
    await card.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(200);
    await btn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(500);
    const box = await card.boundingBox();
    if (box) {
      await page.screenshot({
        path: `${OUT}/${String(i).padStart(2, '0')}__${title}__${colorScheme}.png`,
        clip: {
          x: Math.max(0, box.x - 10),
          y: Math.max(0, box.y - 10),
          width: Math.min(1280, box.width + 20),
          height: Math.min(1100, box.height + 20),
        },
      });
    }
    // Collapse
    await btn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(200);
  }

  await ctx.close();
}

await run('light');
await run('dark');

await b.close();
console.log('✅ done');
