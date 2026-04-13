import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { sql, eq, and } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import type { S1Row } from '../scrapers/sector1.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW_FILE = resolve(__dirname, '../../data/s1_raw.json');

const RRULE_BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

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

/**
 * Normalize street name from Romprest's "Lastname, Firstname" convention
 * to natural "Firstname Lastname", plus general cleanup.
 *
 * Examples:
 *   "Mihalache, Ion"                    → "Ion Mihalache"
 *   "Kiseleff, gral.Pavel Dimitrievici" → "gral. Pavel Dimitrievici Kiseleff"
 *   "1 Mai (se intra prin bl.85)"        → "1 Mai"
 *   "Asociatia de Proprietari X 14"      → unchanged
 */
/**
 * Parse an "Asociatia de Proprietari" entry into a street name + number range.
 *
 * Examples:
 *   "Asociatia de Proprietari bl.12C Abrud 140"           → { street: "Abrud", from: 140, to: 140 }
 *   "Asociatia de Proprietari Academiei 39-41 sc.A"       → { street: "Academiei", from: 39, to: 41 }
 *   "Asociatia de Proprietari bl. ROMARTA Academiei 35-37" → { street: "Academiei", from: 35, to: 37 }
 *   "Asociatia de Proprietari Ion Mihalache 66"           → { street: "Ion Mihalache", from: 66, to: 66 }
 *   "Asociatia de Proprietari bl. Romarta"                → null (no number)
 */
function parseAssocEntry(raw: string): { street: string; from: number; to: number } | null {
  if (!/asocia[tț]ia\s+de\s+proprietari/i.test(raw)) return null;
  let s = raw
    .replace(/^asocia[tț]ia\s+de\.?\s+proprietari/i, '')
    .replace(/\s*bl\.?\s*[A-Za-z0-9\/\-.]+/gi, ' ') // strip 'bl.12C' 'bl. III/6' 'bl 3'
    .replace(/\s*sc\.?\s*[A-Za-z0-9]+/gi, ' ')       // strip 'sc.A'
    .replace(/\s+/g, ' ')
    .trim();

  // Match: "[optional descriptor] StreetName(s) Number[-Number][letter]"
  // Number at END of string
  const m = /^(.+?)\s+(\d+)(?:-(\d+))?[A-Za-z]?\s*$/.exec(s);
  if (!m) return null;

  let streetPart = m[1]!.trim();
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  if (!Number.isFinite(from)) return null;

  // Clean the street part: remove building-name prefixes like "ROMARTA", "Anavia Residence"
  // Heuristic: take the LAST 1-3 words as street name (most Romanian street names are 1-3 words)
  // But prefer NOT to cut off multi-word names like "Ion Mihalache"
  streetPart = streetPart.replace(/^(.*?)(?:\bResidence\b|\bComplex\b|\bParc\b)\s+/i, '');

  return { street: streetPart.trim(), from, to };
}

function cleanStreetName(raw: string): string {
  let s = raw
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*,\s*bl\.?.*$/i, '')
    .replace(/VEZI NOTA.*/i, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Skip swap for non-person entries
  const isAssociation = /asocia[tț]ia|bloc|complex|intrare\b/i.test(s);

  // Swap "Lastname, Firstname-Part" → "Firstname-Part Lastname"
  // Only if there's exactly ONE comma and the part after doesn't look like an address fragment
  if (!isAssociation) {
    const m = /^([A-ZĂÂÎȘȚ][\wăâîșțĂÂÎȘȚ'.\- ]+?),\s*(.+)$/.exec(s);
    if (m) {
      const last = m[1]!.trim();
      let first = m[2]!.trim();
      // Normalize "gral.Pavel" → "gral. Pavel", "col.X" → "col. X", etc.
      first = first.replace(/^([a-zăîș]{2,6})\.([A-ZĂÎȘȚ])/g, '$1. $2');
      s = `${first} ${last}`;
    }
  }

  return s.replace(/\s+/g, ' ').trim();
}

function rrule(days: number[]): string | null {
  const unique = [...new Set(days)].sort();
  if (unique.length === 0) return null;
  const byday = unique.map((d) => RRULE_BYDAY[d]).filter(Boolean).join(',');
  return `FREQ=WEEKLY;BYDAY=${byday}`;
}

const raw = JSON.parse(await readFile(RAW_FILE, 'utf-8')) as {
  rows: S1Row[];
  scrapedAt: string;
};

console.log(`📦 ${raw.rows.length} rânduri brute din ${RAW_FILE}`);

const sourceUrl = 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-case.html';
const sourceFetchedAt = new Date(raw.scrapedAt);

// Get Romprest operator
const [operator] = await db
  .select()
  .from(schema.operators)
  .where(and(eq(schema.operators.sectorId, 1), eq(schema.operators.name, 'Romprest')));
if (!operator) throw new Error('Romprest operator not found — run db:seed first');

// Scraper now outputs asociații rows already tied to a real street (from "Adresa" column),
// so we just normalize names here.
const cleaned = raw.rows
  .map((r) => ({ ...r, street: cleanStreetName(r.street) }))
  .filter((r) => r.street);
const streetNames = new Set(cleaned.map((r) => r.street));
console.log(`🛣  ${streetNames.size} străzi unice după normalizare`);

// Clear existing S1
console.log('🧹 Curăț S1 existent...');
await db.execute(sql`DELETE FROM ${schema.schedules} WHERE zone_id IN (SELECT id FROM ${schema.zones} WHERE sector_id = 1)`);
await db.execute(sql`DELETE FROM ${schema.streetSegments} WHERE sector_id = 1`);
await db.execute(sql`DELETE FROM ${schema.zones} WHERE sector_id = 1`);

// Insert/get streets
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
console.log(`✓ ${streetIdByName.size} străzi în DB`);

// Group rows by (street, from, to, parity, buildingType) to merge wet+dry days
type Key = string;
type Grp = {
  street: string;
  from: number | null;
  to: number | null;
  parity: 'odd' | 'even' | 'both';
  buildingType: 'case' | 'blocuri';
  wetDays: Set<number>;
  dryDays: Set<number>;
  wetExplicit: Set<string>;
  dryExplicit: Set<string>;
};
const groups = new Map<Key, Grp>();
for (const r of cleaned) {
  const key = `${r.street}|${r.numberFrom}|${r.numberTo}|${r.parity}|${r.buildingType}`;
  let g = groups.get(key);
  if (!g) {
    g = {
      street: r.street,
      from: r.numberFrom,
      to: r.numberTo,
      parity: r.parity,
      buildingType: r.buildingType,
      wetDays: new Set(),
      dryDays: new Set(),
      wetExplicit: new Set(),
      dryExplicit: new Set(),
    };
    groups.set(key, g);
  }
  for (const d of r.days.wet) g.wetDays.add(d);
  for (const d of r.days.dry) g.dryDays.add(d);
  for (const d of r.explicitDates?.wet ?? []) g.wetExplicit.add(d);
  for (const d of r.explicitDates?.dry ?? []) g.dryExplicit.add(d);
}
console.log(`🗂  ${groups.size} segmente unice (după merge wet+dry)`);

let zones = 0;
let segments = 0;
let schedules = 0;

for (const g of groups.values()) {
  const streetId = streetIdByName.get(g.street);
  if (!streetId) continue;

  const label = g.from !== null
    ? g.from === g.to
      ? `${g.street} nr. ${g.from}`
      : `${g.street} nr. ${g.from}-${g.to}`
    : g.street;

  const [zone] = await db
    .insert(schema.zones)
    .values({
      sectorId: 1,
      name: `${label} · ${g.buildingType === 'case' ? 'case' : 'blocuri'}`,
      operatorId: operator.id,
    })
    .returning();
  if (!zone) continue;
  zones++;

  await db.insert(schema.streetSegments).values({
    streetId,
    sectorId: 1,
    numberFrom: g.from,
    numberTo: g.to,
    parity: g.parity,
    zoneId: zone.id,
    sourceUrl,
    sourceFetchedAt,
    verifiedAt: sourceFetchedAt,
  });
  segments++;

  const wetRule = rrule([...g.wetDays]);
  if (wetRule) {
    const wetExplicit = [...g.wetExplicit].sort();
    await db.insert(schema.schedules).values({
      zoneId: zone.id,
      wasteType: 'menajer',
      rrule: wetRule,
      buildingType: g.buildingType,
      sourceQuality: 'street_number',
      sourceUrl,
      sourceFetchedAt,
      verifiedAt: sourceFetchedAt,
      overrideDates: wetExplicit.length > 0 ? wetExplicit : null,
    });
    schedules++;
  }

  const dryRule = rrule([...g.dryDays]);
  if (dryRule) {
    const dryExplicit = [...g.dryExplicit].sort();
    await db.insert(schema.schedules).values({
      zoneId: zone.id,
      wasteType: 'reciclabil_uscat',
      rrule: dryRule,
      buildingType: g.buildingType,
      sourceQuality: 'street_number',
      sourceUrl,
      sourceFetchedAt,
      verifiedAt: sourceFetchedAt,
      overrideDates: dryExplicit.length > 0 ? dryExplicit : null,
    });
    schedules++;
  }
}

// Clean up orphan streets (no segments anywhere) — common after rename/dedup
const orphanResult = await db.execute(sql`
  DELETE FROM streets WHERE id NOT IN (SELECT DISTINCT street_id FROM street_segments WHERE street_id IS NOT NULL)
`);

console.log(`\n✅ S1 Romprest încărcat:`);
console.log(`   zone:      ${zones}`);
console.log(`   segmente:  ${segments}`);
console.log(`   schedule-uri: ${schedules} (menajer + reciclabil)`);
console.log(`   orfane șterse: ${orphanResult.count ?? 0}`);
process.exit(0);
