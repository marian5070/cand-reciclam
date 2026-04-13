// Compare the app for every sector — should look uniform
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-per-sector';
await mkdir(OUT, { recursive: true });
const b = await chromium.launch({ headless: true });

const SCENARIOS = [
  { sector: 1, street: 'Dacia', number: 42, streetId: 1265, label: 's1-dacia-42' },
  { sector: 2, street: 'MOSILOR - CALEA', number: 91, streetId: 280, label: 's2-mosilor-91' },
  { sector: 3, street: 'Strada necunoscuta', number: 10, streetId: 0, label: 's3-manual' },
  { sector: 4, street: 'Strada necunoscuta', number: 10, streetId: 0, label: 's4-manual' },
  { sector: 5, street: 'Strada necunoscuta', number: 10, streetId: 0, label: 's5-manual' },
  { sector: 6, street: 'Strada necunoscuta', number: 10, streetId: 0, label: 's6-manual' },
];

for (const s of SCENARIOS) {
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
  await page.evaluate((s) => {
    localStorage.setItem('cr:address', JSON.stringify(s));
    localStorage.setItem('cr:tour-seen', '1');
  }, { streetId: s.streetId, street: s.street, number: s.number, sector: s.sector });
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${s.label}.png`, fullPage: true });
  console.log('  ✓', s.label);
  await ctx.close();
}

await b.close();
console.log('done');
