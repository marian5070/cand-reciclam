// Detailed section snapshots — full-page at each state
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const OUT = '/tmp/cr-snap2';
await mkdir(OUT, { recursive: true });

const shotPage = async (page, name) => {
  const file = `${OUT}/${name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  console.log('  ✓', file);
};

const browser = await chromium.launch({ headless: true });

async function session(colorScheme, name) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    colorScheme,
    reducedMotion: 'reduce', // avoid animation timing issues
  });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:5174/', { waitUntil: 'networkidle' });
  await page.evaluate((scheme) => {
    localStorage.setItem(
      'cr:address',
      JSON.stringify({ streetId: 1265, street: 'Dacia', number: 42, sector: 1 }),
    );
    localStorage.setItem('cr:tour-seen', '1');
    localStorage.setItem('cr:theme', scheme);
  }, colorScheme);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);

  await shotPage(page, `base__${name}`);

  // Hover address pill
  await page.locator('[data-tour="address"]').hover();
  await page.waitForTimeout(600);
  await shotPage(page, `tooltip-address__${name}`);
  await page.mouse.move(0, 600);
  await page.waitForTimeout(300);

  // Open first InfoHint (in building type toggle)
  const infoBtns = page.locator('button[aria-label="Mai multe informații"]');
  const total = await infoBtns.count();
  console.log(`  [${name}] ${total} info buttons found`);
  for (let i = 0; i < Math.min(total, 4); i++) {
    try {
      await infoBtns.nth(i).scrollIntoViewIfNeeded();
      await infoBtns.nth(i).click();
      await page.waitForTimeout(400);
      await shotPage(page, `infohint-${i}__${name}`);
      // close by Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    } catch (e) {
      console.log(`  [${name}] infohint ${i} skipped: ${e.message.slice(0, 80)}`);
    }
  }

  // Hover notify button tooltip
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator('[data-tour="notify"]').hover();
  await page.waitForTimeout(600);
  await shotPage(page, `tooltip-notify__${name}`);
  await page.mouse.move(0, 600);
  await page.waitForTimeout(300);

  // Expand CoverageNote
  await page
    .getByRole('button', { name: /ce date avem pentru sectorul/i })
    .click();
  await page.waitForTimeout(500);
  await shotPage(page, `coverage-expanded__${name}`);

  // Open NotifyDialog
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator('[data-tour="notify"]').click();
  await page.waitForTimeout(700);
  await shotPage(page, `notify-dialog__${name}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Open AddressSwitcher
  await page.locator('[data-tour="address"]').click();
  await page.waitForTimeout(700);
  await shotPage(page, `address-switcher__${name}`);
  // type something
  await page.locator('input[type="text"]').fill('primav');
  await page.waitForTimeout(600);
  await shotPage(page, `address-switcher-typing__${name}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Help dialog
  await page.locator('button[aria-label="Ajutor"]').click();
  await page.waitForTimeout(500);
  await shotPage(page, `help-toggle__${name}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // Guide sheet
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /ghid complet/i }).click();
  await page.waitForTimeout(600);
  await shotPage(page, `guide__${name}`);
  await page.locator('article button').first().click();
  await page.waitForTimeout(400);
  await shotPage(page, `guide-expanded__${name}`);

  await ctx.close();
}

await session('light', 'light');
await session('dark', 'dark');

await browser.close();
console.log('✅ done');
