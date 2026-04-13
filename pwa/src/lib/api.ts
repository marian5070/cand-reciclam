export type StreetSearchResult = {
  id: number;
  name: string;
  slug: string;
  sectors: number[];
  numberRange: { from: number; to: number | null } | null;
  segmentCount: number;
};

export type ApiSchedule = {
  scheduleId: number;
  wasteType:
    | 'menajer'
    | 'reciclabil_uscat'
    | 'bio'
    | 'voluminoase'
    | 'deee'
    | 'textile'
    | 'sticla';
  rrule: string;
  buildingType: 'case' | 'blocuri' | null;
  sourceQuality: 'street_number' | 'sector_uniform' | 'provisional' | 'manual';
  sourceUrl: string | null;
  /** Explicit dates (YYYY-MM-DD) — overrides RRULE when present */
  overrideDates: string[] | null;
  operator: string | null;
  sectorId: number;
  zone: string;
  numberRange: { from: number | null; to: number | null };
};

export async function searchStreets(q: string): Promise<StreetSearchResult[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(`/api/streets?q=${encodeURIComponent(q)}`);
  if (!res.ok) throw new Error(`searchStreets: ${res.status}`);
  return res.json();
}

export type StreetDetails = {
  id: number;
  name: string;
  slug: string;
  sectors: number[];
  numberRange: { from: number; to: number | null } | null;
};

export async function getStreet(id: number): Promise<StreetDetails | null> {
  const res = await fetch(`/api/streets/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getStreet: ${res.status}`);
  return res.json();
}

export async function getSchedule(
  streetId: number,
  number: number | null,
): Promise<ApiSchedule[]> {
  const url = new URL('/api/schedule', window.location.origin);
  url.searchParams.set('street_id', String(streetId));
  if (number !== null) url.searchParams.set('number', String(number));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`getSchedule: ${res.status}`);
  return res.json();
}
