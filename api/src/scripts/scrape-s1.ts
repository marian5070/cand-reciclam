import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scrapeS1Case, scrapeS1Asociatii } from '../scrapers/sector1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../../data/');
const OUT_FILE = resolve(OUT_DIR, 's1_raw.json');

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

const started = Date.now();
console.log('🔎 Scrape S1 Romprest — două tabele (case + asociații)');

const caseRows = await scrapeS1Case();
console.log(`  ✓ case: ${caseRows.length} rânduri`);

const asocRows = await scrapeS1Asociatii();
console.log(`  ✓ asociații: ${asocRows.length} rânduri`);

const rows = [...caseRows, ...asocRows];
const streets = new Set(rows.map((r) => r.street));
console.log(`Total: ${rows.length} rânduri, ${streets.size} străzi unice`);

await writeFile(
  OUT_FILE,
  JSON.stringify(
    { rows, scrapedAt: new Date().toISOString(), elapsedSec: (Date.now() - started) / 1000 },
    null,
    2,
  ),
);
console.log(`📝 ${OUT_FILE}`);
process.exit(0);
