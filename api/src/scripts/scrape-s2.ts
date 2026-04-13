import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { scrapeAll, type S2Row } from '../scrapers/sector2.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGRAPHS: string[] = [];
for (const a of ALPHABET) for (const b of ALPHABET) DIGRAPHS.push(a + b);

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '../../data/');
const OUT_FILE = resolve(OUT_DIR, 's2_raw.json');
const PROGRESS_FILE = resolve(OUT_DIR, 's2_progress.log');

if (!existsSync(OUT_DIR)) await mkdir(OUT_DIR, { recursive: true });

console.log(`🔎 S2 scrape: ${DIGRAPHS.length} queries × 1.2s ≈ ${Math.round((DIGRAPHS.length * 1.2) / 60)} min`);

const progressLines: string[] = [];
const start = Date.now();

const rows: S2Row[] = await scrapeAll(
  DIGRAPHS,
  1200,
  (q, found, total) => {
    const elapsed = ((Date.now() - start) / 1000).toFixed(0);
    const line = `[${elapsed}s] ${q}: +${found} found, ${total} unique total`;
    progressLines.push(line);
    console.log(line);
  },
);

const elapsed = ((Date.now() - start) / 1000).toFixed(0);
console.log(`\n✅ scrape done in ${elapsed}s: ${rows.length} unique rows`);

await writeFile(OUT_FILE, JSON.stringify({ rows, scrapedAt: new Date().toISOString(), elapsedSec: Number(elapsed) }, null, 2));
await writeFile(PROGRESS_FILE, progressLines.join('\n'));
console.log(`📝 saved to ${OUT_FILE}`);

// Stats
const streets = new Set(rows.map((r) => r.street));
const numbers = rows.length;
const byType: Record<string, number> = {};
for (const r of rows) byType[r.wasteType] = (byType[r.wasteType] ?? 0) + 1;
console.log(`Streets: ${streets.size}, rows: ${numbers}, by type:`, byType);

process.exit(0);
