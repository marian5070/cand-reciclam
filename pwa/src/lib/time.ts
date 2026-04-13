/**
 * Human-readable "when next" label + proximity score [0..1]
 * proximity: 0 = far away, 1 = imminent (<1h)
 */
export function proximityLabel(nextIso: string, now = new Date()): {
  label: string;
  sub: string;
  hoursUntil: number;
  proximity: number;
  imminent: boolean;
} {
  const next = new Date(nextIso);
  const diffMs = next.getTime() - now.getTime();
  const hours = diffMs / 3_600_000;
  const days = Math.floor(hours / 24);

  const nextMid = new Date(next);
  nextMid.setHours(0, 0, 0, 0);
  const nowMid = new Date(now);
  nowMid.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((nextMid.getTime() - nowMid.getTime()) / 86_400_000);

  let label: string;
  if (hours < 0) label = 'Acum';
  else if (dayDiff === 0) label = 'Astăzi';
  else if (dayDiff === 1) label = 'Mâine';
  else if (dayDiff === 2) label = 'Poimâine';
  else if (dayDiff <= 6) label = DAY_NAMES[next.getDay()]!;
  else if (dayDiff === 7) label = 'Peste 1 săptămână';
  else label = `Peste ${dayDiff} zile`;

  const hh = String(next.getHours()).padStart(2, '0');
  const mm = String(next.getMinutes()).padStart(2, '0');
  const timeStr = `${hh}:${mm}`;

  let sub: string;
  if (hours < 0) sub = timeStr;
  else if (hours < 1) sub = `în ${Math.max(1, Math.round(hours * 60))} min`;
  else if (hours < 12) sub = `în ~${Math.round(hours)} h · ${timeStr}`;
  else sub = timeStr;

  // proximity: sigmoid-like around 24h
  const prox = 1 / (1 + Math.max(0, hours) / 12);

  return {
    label,
    sub,
    hoursUntil: hours,
    proximity: prox,
    imminent: hours <= 14 && hours > -1,
    ...{ _ignored: days },
  };
}

export const DAY_NAMES = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
export const DAY_SHORT = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

/** Local date key (YYYY-MM-DD în timezone local, nu UTC). Folosit pentru bucketing corect. */
export function localDateKey(d: Date | string): string {
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Returns two mesh colors that shift warmer as pickup approaches.
 * Returned as oklch strings for CSS custom props.
 */
export function ambientColors(proximity: number): {
  a: string;
  b: string;
  c: string;
} {
  // proximity 0 -> cool sage blue, 1 -> warm amber
  const hue = 150 - proximity * 85; // 150 (sage) -> 65 (amber)
  const chroma = 0.08 + proximity * 0.1;
  const L1 = 70 - proximity * 10;
  const L2 = 55 - proximity * 5;
  return {
    a: `oklch(${L1}% ${chroma} ${hue})`,
    b: `oklch(${L2}% ${chroma + 0.04} ${hue + 15})`,
    c: `oklch(${L1 - 10}% ${chroma - 0.02} ${hue - 20})`,
  };
}

export function formatDate(iso: string): { dow: string; day: number; month: string } {
  const d = new Date(iso);
  return {
    dow: DAY_SHORT[d.getDay()]!,
    day: d.getDate(),
    month: MONTH_SHORT[d.getMonth()]!,
  };
}

export const MONTH_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec'];
