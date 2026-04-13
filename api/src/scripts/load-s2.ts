import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { db, schema } from '../db/index.js';
import { sql, eq, and } from 'drizzle-orm';
import type { S2Row } from '../scrapers/sector2.js';

const RRULE_BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
const __dirname = dirname(fileURLToPath(import.meta.url));

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[ș]/g, 's')
    .replace(/[ț]/g, 't')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const RAW_FILE = resolve(__dirname, '../../data/s2_raw.json');
const raw = JSON.parse(await readFile(RAW_FILE, 'utf-8')) as {
  rows: S2Row[];
  scrapedAt: string;
};

console.log(`📦 loaded ${raw.rows.length} rows from ${RAW_FILE}`);
console.log(`   scraped at: ${raw.scrapedAt}`);

// Get Supercom operator (sector 2)
const [operator] = await db
  .select()
  .from(schema.operators)
  .where(and(eq(schema.operators.sectorId, 2), eq(schema.operators.name, 'Supercom')));
if (!operator) throw new Error('Supercom operator not found — run db:seed first');

const sourceUrl = operator.url ?? 'https://www.impozitelocale2.ro/gunoi/';
const sourceFetchedAt = new Date(raw.scrapedAt);

// Group rows by (street, number) → {wasteType → set of days}
type Key = string; // "street|number"
type Agg = { street: string; number: number; byType: Map<S2Row['wasteType'], Set<number>> };
const groups = new Map<Key, Agg>();

for (const r of raw.rows) {
  const key = `${r.street}|${r.number}`;
  let g = groups.get(key);
  if (!g) {
    g = { street: r.street, number: r.number, byType: new Map() };
    groups.set(key, g);
  }
  let set = g.byType.get(r.wasteType);
  if (!set) {
    set = new Set();
    g.byType.set(r.wasteType, set);
  }
  set.add(r.dayOfWeek);
}

console.log(`🗂  ${groups.size} unique (street, number) pairs`);

// Unique streets
const streetNames = new Set<string>();
for (const g of groups.values()) streetNames.add(g.street);
console.log(`🛣  ${streetNames.size} unique streets`);

// Clear existing S2 data for idempotency
console.log('🧹 clearing existing S2 zones/schedules/segments...');
await db.execute(sql`DELETE FROM ${schema.schedules} WHERE zone_id IN (SELECT id FROM ${schema.zones} WHERE sector_id = 2)`);
await db.execute(sql`DELETE FROM ${schema.streetSegments} WHERE sector_id = 2`);
await db.execute(sql`DELETE FROM ${schema.zones} WHERE sector_id = 2`);

// Insert or get streets
const streetIdByName = new Map<string, number>();
for (const name of streetNames) {
  const slug = slugify(name);
  const existing = await db.select().from(schema.streets).where(eq(schema.streets.slug, slug)).limit(1);
  if (existing.length > 0 && existing[0]) {
    streetIdByName.set(name, existing[0].id);
  } else {
    const [inserted] = await db.insert(schema.streets).values({ name, slug }).returning();
    if (inserted) streetIdByName.set(name, inserted.id);
  }
}
console.log(`✓ ${streetIdByName.size} streets ensured`);

// For each group, create a zone + segment + schedules
let zoneCount = 0;
let segmentCount = 0;
let scheduleCount = 0;

const CHUNK = 200;
const groupArr = [...groups.values()];

for (let i = 0; i < groupArr.length; i += CHUNK) {
  const chunk = groupArr.slice(i, i + CHUNK);
  for (const g of chunk) {
    const streetId = streetIdByName.get(g.street);
    if (!streetId) continue;

    // One zone per (street, number) in S2 — reflects the street-level granularity
    const [zone] = await db
      .insert(schema.zones)
      .values({
        sectorId: 2,
        name: `${g.street} nr. ${g.number}`,
        operatorId: operator.id,
      })
      .returning();
    if (!zone) continue;
    zoneCount++;

    // Segment covering just this number
    await db.insert(schema.streetSegments).values({
      streetId,
      sectorId: 2,
      numberFrom: g.number,
      numberTo: g.number,
      parity: 'both',
      zoneId: zone.id,
      sourceUrl,
      sourceFetchedAt,
      verifiedAt: sourceFetchedAt,
    });
    segmentCount++;

    // One schedule per waste_type in this group, with RRULE covering all days
    for (const [wasteType, dayset] of g.byType.entries()) {
      const days = [...dayset].sort();
      const byday = days.map((d) => RRULE_BYDAY[d]).filter(Boolean).join(',');
      const rrule = `FREQ=WEEKLY;BYDAY=${byday}`;
      await db.insert(schema.schedules).values({
        zoneId: zone.id,
        wasteType,
        rrule,
        sourceQuality: 'street_number',
        sourceUrl,
        sourceFetchedAt,
        verifiedAt: sourceFetchedAt,
      });
      scheduleCount++;
    }
  }
  if ((i + CHUNK) % 1000 === 0) console.log(`  ... ${i + CHUNK}/${groupArr.length}`);
}

console.log(`\n✅ S2 loaded:`);
console.log(`   zones:     ${zoneCount}`);
console.log(`   segments:  ${segmentCount}`);
console.log(`   schedules: ${scheduleCount}`);
process.exit(0);
