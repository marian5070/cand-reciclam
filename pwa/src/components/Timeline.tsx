import { useMemo } from 'react';
import type { Pickup } from '../lib/types.js';
import { WASTE_LABEL } from '../lib/types.js';
import { formatDate, localDateKey } from '../lib/time.js';
import { WasteIcon, wasteTint } from './WasteIcon.js';
import { InfoHint } from './InfoHint.js';

type DayBucket = {
  dateKey: string;
  date: Date;
  pickups: Pickup[];
};

function bucketByDay(pickups: Pickup[], days = 14): DayBucket[] {
  const buckets = new Map<string, DayBucket>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const key = localDateKey(d);
    buckets.set(key, { dateKey: key, date: d, pickups: [] });
  }
  for (const p of pickups) {
    const key = localDateKey(p.date);
    const b = buckets.get(key);
    if (b) b.pickups.push(p);
  }
  return [...buckets.values()];
}

export function Timeline({ pickups, loading: _loading = false }: { pickups: Pickup[]; loading?: boolean }) {
  const days = useMemo(() => bucketByDay(pickups, 14), [pickups]);
  // Timeline still renders all 14 day cards when pickups is empty —
  // cards show "— nimic programat —" consistently, same visual shell.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <section className="relative" data-tour="timeline">
      <div className="mx-auto max-w-7xl px-6 pb-6">
        <header className="flex flex-col gap-1 mb-4">
          <h2 className="flex items-center gap-2 text-sm uppercase tracking-[0.18em] text-[color:var(--color-muted)] font-semibold">
            Toate colectările programate
            <InfoHint size={14} side="bottom">
              <p className="font-medium mb-1.5 text-[color:var(--color-fg)]">Cum citești timeline-ul</p>
              <p>Fiecare card e o zi. Bara colorată din stânga cardului indică tipul principal de deșeu din acea zi. Zilele fără colectare sunt estompate.</p>
              <p className="mt-2 text-[color:var(--color-muted)]">Trage orizontal cu degetul sau rotița mouse-ului.</p>
            </InfoHint>
          </h2>
          <div className="flex items-baseline justify-between">
            <p className="text-base text-[color:var(--color-muted)]">
              Următoarele 14 zile · ce și când se scoate
            </p>
            <span className="text-sm text-[color:var(--color-subtle)] hidden sm:inline">
              trage orizontal →
            </span>
          </div>
        </header>
      </div>

      {/* Horizontal rail with scroll-snap */}
      <div className="relative">
        <div
          className="flex gap-4 overflow-x-auto px-6 pb-10 snap-x snap-mandatory scroll-smooth [scrollbar-width:thin]"
          style={{ scrollPaddingLeft: '1.5rem' }}
        >
          {days.map((b, i) => (
            <DayCard
              key={b.dateKey}
              bucket={b}
              isToday={b.date.getTime() === today.getTime()}
              isFirst={i === 0}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function DayCard({
  bucket,
  isToday,
}: {
  bucket: DayBucket;
  isToday: boolean;
  isFirst: boolean;
}) {
  const { dow, day, month } = formatDate(bucket.date.toISOString());
  const hasPickups = bucket.pickups.length > 0;
  const primaryTint = hasPickups ? wasteTint(bucket.pickups[0]!.wasteType) : null;

  return (
    <article
      className={`rail-card snap-start shrink-0 w-[240px] sm:w-[260px] flex flex-col rounded-3xl border p-5 transition-all ${
        isToday
          ? 'bg-[color:var(--color-surface)] border-[color:var(--color-accent)] shadow-[0_8px_32px_-12px_oklch(55%_0.12_150/0.35)]'
          : hasPickups
            ? 'bg-[color:var(--color-surface)]/70 border-[color:var(--color-border)]'
            : 'bg-transparent border-[color:var(--color-border)]/60 opacity-70'
      }`}
      style={primaryTint ? { borderLeftColor: primaryTint, borderLeftWidth: '3px' } : undefined}
    >
      {/* date */}
      <div className="flex items-baseline gap-2">
        <span className="text-sm uppercase tracking-widest text-[color:var(--color-muted)] font-semibold">{dow}</span>
        {isToday && (
          <span className="text-xs uppercase tracking-wider rounded-full bg-[color:var(--color-sage-500)] text-white px-2 py-0.5 font-semibold">
            azi
          </span>
        )}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-mono text-[2.5rem] font-semibold tabular-nums tracking-tight leading-none">{day}</span>
        <span className="text-base text-[color:var(--color-muted)]">{month}</span>
      </div>

      {/* pickups */}
      <div className="mt-4 flex-1 flex flex-col gap-2">
        {hasPickups ? (
          bucket.pickups.map((p, i) => {
            const t = wasteTint(p.wasteType);
            return (
              <div
                key={i}
                className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                style={{
                  background: `color-mix(in oklch, ${t} 15%, var(--color-surface))`,
                  border: `1px solid color-mix(in oklch, ${t} 30%, transparent)`,
                }}
              >
                <WasteIcon type={p.wasteType} size={18} />
                <span
                  className="text-[15px] font-semibold"
                  // adaptive: mix tint with fg — darker on light mode, lighter on dark mode
                  style={{ color: `color-mix(in oklch, ${t} 35%, var(--color-fg))` }}
                >
                  {WASTE_LABEL[p.wasteType]}
                </span>
                <span className="ml-auto font-mono text-sm text-[color:var(--color-muted)]">
                  {new Date(p.date).toTimeString().slice(0, 5)}
                </span>
              </div>
            );
          })
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-[color:var(--color-subtle)] italic">— nimic programat —</span>
          </div>
        )}
      </div>
    </article>
  );
}
