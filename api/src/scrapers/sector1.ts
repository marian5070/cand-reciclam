import * as cheerio from 'cheerio';
import { makeClient } from './_client.js';

const SOURCES = {
  case: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-case.html',
  asociatii: 'https://programe.romprest.eu/sectorul-1/colectare-selectiva/program-colectare-asociatii.html',
};

export type S1Row = {
  street: string;
  numberFrom: number | null;
  numberTo: number | null;
  parity: 'odd' | 'even' | 'both';
  days: { wet: number[]; dry: number[] };
  /** Explicit list of dates (YYYY-MM-DD) when source publishes them; overrides RRULE interpretation */
  explicitDates: { wet: string[]; dry: string[] };
  startTime?: string;
  buildingType: 'case' | 'blocuri';
  rawNumbers: string;
};

const MONTHS_RO: Record<string, number> = {
  ianuarie: 1, februarie: 2, martie: 3, aprilie: 4, mai: 5, iunie: 6,
  iulie: 7, august: 8, septembrie: 9, octombrie: 10, noiembrie: 11, decembrie: 12,
};

/**
 * Extract explicit date list from Romprest schedule cells.
 * Example input: "miercuri din saptamana para ;Ianuarie: 14, 28 | Februarie: 11, 25 | ..."
 * Output: ['2026-01-14', '2026-01-28', '2026-02-11', '2026-02-25', ...]
 */
function parseExplicitDates(raw: string, year: number = new Date().getFullYear()): string[] {
  const out: string[] = [];
  const re = /(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)\s*:\s*([\d,\s]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(raw)) !== null) {
    const monthName = m[1]!.toLowerCase();
    const month = MONTHS_RO[monthName];
    if (!month) continue;
    const days = m[2]!
      .split(',')
      .map((s) => Number.parseInt(s.trim(), 10))
      .filter((d) => Number.isFinite(d) && d >= 1 && d <= 31);
    for (const day of days) {
      out.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    }
  }
  return out;
}

const DAY_RO: Record<string, number> = {
  LUNI: 1,
  MARTI: 2,
  'MARȚI': 2,
  MIERCURI: 3,
  JOI: 4,
  VINERI: 5,
  SAMBATA: 6,
  'SÂMBĂTĂ': 6,
  DUMINICA: 7,
  'DUMINICĂ': 7,
};

function parseDays(raw: string): number[] {
  if (!raw) return [];
  // Normalize diacritics
  const clean = raw
    .toUpperCase()
    .replace(/[ȘȚÂÎĂ]/g, (c) => ({ Ș: 'S', Ț: 'T', Â: 'A', Î: 'I', Ă: 'A' }[c] ?? c));
  // Strip explicit date lists (they often contain month names that look like day names,
  // e.g. 'Martie' vs 'Marti'). Keep only content before the first colon-day list or semicolon list.
  const beforeDates = clean.split(/[;,]|(?:IANUARIE|FEBRUARIE|MARTIE|APRILIE|MAI|IUNIE|IULIE|AUGUST|SEPTEMBRIE|OCTOMBRIE|NOIEMBRIE|DECEMBRIE)/)[0] ?? clean;

  const out = new Set<number>();
  for (const [key, val] of Object.entries(DAY_RO)) {
    const normalized = key
      .toUpperCase()
      .replace(/[ȘȚÂÎĂ]/g, (c) => ({ Ș: 'S', Ț: 'T', Â: 'A', Î: 'I', Ă: 'A' }[c] ?? c));
    // Word-boundary match: day name must be a standalone word, not a substring of a month
    const re = new RegExp(`(?:^|[^A-Z])${normalized}(?:[^A-Z]|$)`);
    if (re.test(beforeDates)) out.add(val);
  }
  return [...out].sort();
}

/**
 * Parse a number range string like "1-5", "4,8,4B,4C", "pare", "toate"
 * Returns array of {from, to, parity} segments. Letters (4B, 4C) are stripped.
 */
function parseNumberRange(raw: string): Array<{ from: number | null; to: number | null; parity: 'odd' | 'even' | 'both' }> {
  if (!raw) return [{ from: null, to: null, parity: 'both' }];
  const clean = raw.trim().toLowerCase();

  // Special cases
  if (clean === 'toate' || clean === 'toata strada' || clean === '') {
    return [{ from: null, to: null, parity: 'both' }];
  }
  if (clean.startsWith('pare')) return [{ from: null, to: null, parity: 'even' }];
  if (clean.startsWith('impare')) return [{ from: null, to: null, parity: 'odd' }];

  const segments: Array<{ from: number | null; to: number | null; parity: 'odd' | 'even' | 'both' }> = [];

  // Split by commas OR semicolons (Romprest uses both, e.g. "57-65; 36-46")
  const parts = clean.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
  for (const part of parts) {
    // Range: "1-5" or "10 - 20"
    const rangeMatch = /^(\d+)\s*-\s*(\d+)/.exec(part);
    if (rangeMatch) {
      const from = Number(rangeMatch[1]);
      const to = Number(rangeMatch[2]);
      if (Number.isFinite(from) && Number.isFinite(to)) {
        segments.push({ from, to, parity: 'both' });
        continue;
      }
    }
    // Single number (possibly with letter suffix: 4B, 12bis)
    const singleMatch = /^(\d+)/.exec(part);
    if (singleMatch) {
      const n = Number(singleMatch[1]);
      if (Number.isFinite(n)) {
        segments.push({ from: n, to: n, parity: 'both' });
      }
    }
    // Skip unparseable parts
  }
  if (segments.length === 0) {
    return [{ from: null, to: null, parity: 'both' }];
  }
  return segments;
}

function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchCaseTable(url: string): Promise<S1Row[]> {
  const { client } = makeClient();
  const res = await client.get(url);
  const $ = cheerio.load(res.body);
  const rows: S1Row[] = [];

  $('table tr').each((i, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 5) return;

    const street = cleanText($(tds[0]).text());
    const startTime = cleanText($(tds[1]).text());
    const numbersRaw = cleanText($(tds[2]).text());
    const wetRaw = cleanText($(tds[3]).text());
    const dryRaw = cleanText($(tds[4]).text());

    if (!street || street.toUpperCase().includes('ARTERA')) return;

    const wetDays = parseDays(wetRaw);
    const dryDays = parseDays(dryRaw);
    const wetExplicit = parseExplicitDates(wetRaw);
    const dryExplicit = parseExplicitDates(dryRaw);
    const segments = parseNumberRange(numbersRaw);

    for (const seg of segments) {
      rows.push({
        street,
        numberFrom: seg.from,
        numberTo: seg.to,
        parity: seg.parity,
        days: { wet: wetDays, dry: dryDays },
        explicitDates: { wet: wetExplicit, dry: dryExplicit },
        startTime,
        buildingType: 'case',
        rawNumbers: numbersRaw,
      });
    }
  });

  return rows;
}

/**
 * Asociații table has a COMPLETELY DIFFERENT layout:
 *  [0] Denumire utilizator
 *  [1] Adresa (e.g. "strada Abrud nr. 140" or "Bulevardul Iancu de Hunedoara nr. 25")
 *  [2..8] seven cells: L, Ma, Mi, J, V, S, D — 'X' if collected that day
 *  [9] fractie umeda/uscata note (often: "colectarea fractiei uscate in aceeasi zi cu fractia umeda")
 */
async function fetchAsociatiiTable(url: string): Promise<S1Row[]> {
  const { client } = makeClient();
  const res = await client.get(url);
  const $ = cheerio.load(res.body);
  const rows: S1Row[] = [];

  $('table tr').each((_i, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 10) return; // header/subheader have fewer

    const name = cleanText($(tds[0]).text());
    const address = cleanText($(tds[1]).text());
    // cells [2..8] = days L..D
    const dayFlags: boolean[] = [];
    for (let i = 2; i <= 8; i++) {
      const v = cleanText($(tds[i]).text()).toUpperCase();
      dayFlags.push(v === 'X');
    }
    const note = cleanText($(tds[9]).text()).toLowerCase();

    if (!name || !address) return;

    // Extract street + number from address
    const parsed = parseAsocAddress(address);
    if (!parsed) return;

    // Day index 0=L(MO=1), 1=Ma(TU=2), ..., 6=D(SU=7)
    const wetDayInts: number[] = [];
    for (let i = 0; i < 7; i++) {
      if (dayFlags[i]) wetDayInts.push(i + 1);
    }

    // Dry days: if note says "aceeasi zi cu fractia umeda" → same as wet
    // Otherwise, we assume it's the same day (conservative default for MVP)
    // TODO: parse more complex note variants
    const dryDayInts = wetDayInts.slice();

    rows.push({
      street: parsed.street,
      numberFrom: parsed.from,
      numberTo: parsed.to,
      parity: 'both',
      days: { wet: wetDayInts, dry: dryDayInts },
      explicitDates: { wet: [], dry: [] },
      startTime: undefined,
      buildingType: 'blocuri',
      rawNumbers: `${parsed.from}${parsed.to !== parsed.from ? '-' + parsed.to : ''}`,
    });
  });

  return rows;
}

/**
 * Parse address strings like:
 *   "strada Abrud nr. 140"
 *   "Bulevardul Iancu de Hunedoara nr. 25"
 *   "Sos. Nordului nr. 62-68"
 *   "Aleea Alexandru nr. 22-24"
 */
function parseAsocAddress(raw: string): { street: string; from: number; to: number } | null {
  // Strip street type prefixes: strada, str., bulevardul, bld., bd., sos., soseaua, aleea, calea, piata, intrarea
  let s = raw
    .replace(/^(strada|str\.?|bulevardul|bld\.?|bd\.?|soseaua|sos\.?|aleea|calea|piata|pia[țt]a|intrarea|intr\.?|drumul|splaiul)\s+/i, '')
    .trim();

  // Extract number(s): "nr. 140" or "nr. 62-68" or just "140"
  const m = /^(.+?)\s+(?:nr\.?\s*)?(\d+)(?:\s*-\s*(\d+))?[A-Za-z]?\s*$/.exec(s);
  if (!m) return null;
  const street = m[1]!.replace(/,+$/, '').trim();
  const from = Number(m[2]);
  const to = m[3] ? Number(m[3]) : from;
  if (!street || !Number.isFinite(from)) return null;
  return { street, from, to };
}

export async function scrapeS1Case(): Promise<S1Row[]> {
  return fetchCaseTable(SOURCES.case);
}

export async function scrapeS1Asociatii(): Promise<S1Row[]> {
  return fetchAsociatiiTable(SOURCES.asociatii);
}

export const S1_SOURCE_URL = SOURCES.case;
