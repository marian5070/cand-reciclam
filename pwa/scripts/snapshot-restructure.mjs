import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-restructure';
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

const routes = [
  { url: 'http://127.0.0.1:5174/', name: 'landing' },
  { url: 'http://127.0.0.1:5174/sector/1', name: 'sector-1' },
  { url: 'http://127.0.0.1:5174/sector/3', name: 'sector-3' },
  { url: 'http://127.0.0.1:5174/sector/5', name: 'sector-5' },
  { url: 'http://127.0.0.1:5174/sector/6', name: 'sector-6' },
  { url: 'http://127.0.0.1:5174/despre', name: 'despre' },
  { url: 'http://127.0.0.1:5174/termeni', name: 'termeni' },
  { url: 'http://127.0.0.1:5174/confidentialitate', name: 'confidentialitate' },
  { url: 'http://127.0.0.1:5174/adresa/1265/42?sector=1', name: 'schedule-dacia-42' },
];

for (const { url, name } of routes) {
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log('  ✓', name);
  } catch (e) {
    console.log('  ✗', name, String(e).slice(0, 120));
  }
  await ctx.close();
}

await b.close();
console.log('done');
