// Snapshot the app in common states for design review.
// Usage: node scripts/snapshot.mjs
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-snap';
await mkdir(OUT, { recursive: true });

async function shot(page, name) {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log('  ✓', file);
}

const viewports = [
  { name: 'desktop', size: { width: 1280, height: 900 } },
  { name: 'mobile', size: { width: 390, height: 844 } },
];

const scenarios = [
  {
    name: 'onboarding',
    setup: async (page) => {
      await page.goto('http://127.0.0.1:5174/');
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForTimeout(800);
    },
  },
  {
    name: 'dacia-36',
    setup: async (page) => {
      await page.goto('http://127.0.0.1:5174/');
      await page.evaluate(() => {
        localStorage.setItem(
          'cr:address',
          JSON.stringify({ streetId: 1265, street: 'Dacia', number: 36, sector: 1 }),
        );
        localStorage.setItem('cr:tour-seen', '1');
      });
      await page.reload();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'dacia-42-both-types',
    setup: async (page) => {
      await page.goto('http://127.0.0.1:5174/');
      await page.evaluate(() => {
        localStorage.setItem(
          'cr:address',
          JSON.stringify({ streetId: 1265, street: 'Dacia', number: 42, sector: 1 }),
        );
        localStorage.setItem('cr:tour-seen', '1');
      });
      await page.reload();
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'empty-state',
    setup: async (page) => {
      await page.goto('http://127.0.0.1:5174/');
      await page.evaluate(() => {
        localStorage.setItem(
          'cr:address',
          JSON.stringify({ streetId: 1265, street: 'Dacia', number: 9999, sector: 1 }),
        );
        localStorage.setItem('cr:tour-seen', '1');
      });
      await page.reload();
      await page.waitForTimeout(1200);
    },
  },
];

const browser = await chromium.launch({ headless: true });

for (const vp of viewports) {
  for (const s of scenarios) {
    const ctx = await browser.newContext({ viewport: vp.size, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    await s.setup(page);
    await shot(page, `${s.name}__${vp.name}`);
    await ctx.close();
  }
}

// Also snapshot guide sheet (needs click to open)
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:5174/');
await page.evaluate(() => {
  localStorage.setItem('cr:address', JSON.stringify({ streetId: 1265, street: 'Dacia', number: 36, sector: 1 }));
  localStorage.setItem('cr:tour-seen', '1');
});
await page.reload();
await page.waitForTimeout(1000);
// click the ghid button — it has text "Ghid complet de sortare"
await page.getByRole('button', { name: /ghid complet/i }).click().catch(() => {});
await page.waitForTimeout(800);
await shot(page, 'guide__desktop');
// expand first category
await page.locator('article button').first().click().catch(() => {});
await page.waitForTimeout(400);
await shot(page, 'guide-expanded__desktop');
await ctx.close();

// Dark mode
const ctxDark = await browser.newContext({
  viewport: { width: 1280, height: 900 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
});
const pageD = await ctxDark.newPage();
await pageD.goto('http://127.0.0.1:5174/');
await pageD.evaluate(() => {
  localStorage.setItem('cr:address', JSON.stringify({ streetId: 1265, street: 'Dacia', number: 36, sector: 1 }));
  localStorage.setItem('cr:tour-seen', '1');
  localStorage.setItem('cr:theme', 'dark');
});
await pageD.reload();
await pageD.waitForTimeout(1200);
await shot(pageD, 'dacia-36__desktop-dark');
await ctxDark.close();

await browser.close();
console.log('\n✅ done');
