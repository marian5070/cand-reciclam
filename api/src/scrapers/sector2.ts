import * as cheerio from 'cheerio';
import { makeClient, sleep } from './_client.js';

const BASE = 'https://www.impozitelocale2.ro/gunoi/';

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

const RRULE_BYDAY = ['', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export type S2Row = {
  street: string;        // ex. "MIHAI BRAVU - SOS."
  number: number;
  dayOfWeek: number;     // 1..7 (ISO)
  wasteType: 'menajer' | 'reciclabil_uscat';
};

const client = makeClient();

async function getFreshSession(): Promise<string> {
  const res = await client.client.get(BASE);
  const $ = cheerio.load(res.body);
  const csrf = $('input[name="csrf_token"]').attr('value');
  if (!csrf) throw new Error('CSRF token not found on base page');
  return csrf;
}

async function search(query: string): Promise<string> {
  const csrf = await getFreshSession();
  const res = await client.client.post(BASE, {
    form: {
      valoarecnp: query,
      cnpcaut: 'Cauta',
      activare: 'apasarebuton',
      csrf_token: csrf,
    },
  });
  return res.body;
}

function parseRows(html: string): S2Row[] {
  const $ = cheerio.load(html);
  const rows: S2Row[] = [];

  // Split into menajer / selectiv by <a name='...'> anchors
  const menajerAnchor = html.indexOf("<a name='listamen'>");
  const selectivAnchor = html.indexOf("<a name='listasel'>");

  if (menajerAnchor === -1) return rows;

  const menajerHtml =
    selectivAnchor > menajerAnchor ? html.slice(menajerAnchor, selectivAnchor) : html.slice(menajerAnchor);
  const selectivHtml = selectivAnchor > 0 ? html.slice(selectivAnchor) : '';

  const extract = (section: string, wasteType: S2Row['wasteType']): S2Row[] => {
    const $s = cheerio.load(section);
    const out: S2Row[] = [];
    $s('tr.deciziil_tabel').each((_, tr) => {
      const tds = $s(tr).find('td');
      if (tds.length < 4) return;
      const street = $s(tds[1]).text().trim().replace(/\s+/g, ' ');
      const numberRaw = $s(tds[2]).text().trim();
      const dayRaw = $s(tds[3]).text().trim().toUpperCase().replace(/\s+/g, '');
      const number = Number.parseInt(numberRaw, 10);
      const dayOfWeek = DAY_RO[dayRaw];
      if (!street || !Number.isFinite(number) || !dayOfWeek) return;
      out.push({ street, number, dayOfWeek, wasteType });
    });
    return out;
  };

  rows.push(...extract(menajerHtml, 'menajer'));
  if (selectivHtml) rows.push(...extract(selectivHtml, 'reciclabil_uscat'));

  return rows;
}

export async function scrapeQuery(query: string): Promise<S2Row[]> {
  const html = await search(query);
  return parseRows(html);
}

/**
 * Enumerate all S2 data by querying A-Z. Dedupes on (street, number, day, wasteType).
 * Returns unique rows + stats.
 */
export async function scrapeAll(
  queries: string[] = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  delayMs = 1200,
  onProgress?: (q: string, found: number, total: number) => void,
): Promise<S2Row[]> {
  const seen = new Map<string, S2Row>();
  for (const q of queries) {
    try {
      const rows = await scrapeQuery(q);
      for (const r of rows) {
        const key = `${r.street}|${r.number}|${r.dayOfWeek}|${r.wasteType}`;
        if (!seen.has(key)) seen.set(key, r);
      }
      onProgress?.(q, rows.length, seen.size);
    } catch (err) {
      console.error(`  [!] query '${q}' failed:`, (err as Error).message);
    }
    await sleep(delayMs);
  }
  return [...seen.values()];
}

export function rowsToRRule(days: number[]): string {
  const byday = [...new Set(days)].sort().map((d) => RRULE_BYDAY[d]).filter(Boolean).join(',');
  return `FREQ=WEEKLY;BYDAY=${byday}`;
}
