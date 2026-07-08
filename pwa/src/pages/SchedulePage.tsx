import { useEffect, useState } from 'react';
import { Hero } from '../components/Hero.js';
import { Timeline } from '../components/Timeline.js';
import { MiniMap } from '../components/MiniMap.js';
import { CoverageNote } from '../components/CoverageNote.js';
import { AddressSwitcher, PeekBar } from '../components/AddressSwitcher.js';
import { NotifyDialog } from '../components/NotifyDialog.js';
import { GuideSheet } from '../components/GuideSheet.js';
import { LegalFooter } from '../components/LegalFooter.js';
import { Link, navigate } from '../lib/router.js';
import { ArrowLeft, Book } from 'lucide-react';
import { getSchedule, getStreet, type ApiSchedule } from '../lib/api.js';
import { WASTE_LABEL } from '../lib/types.js';
import type { Address, Pickup, WasteType, SourceQuality } from '../lib/types.js';
import { usePageMeta, useStructuredData, useOptionalStructuredData } from '../lib/meta.js';
import { getSector, FACTUAL_AS_OF } from '../lib/sectors.js';

type LoadState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'ok';
      pickups: Pickup[];
      rawSchedules: ApiSchedule[];
      meta: { sourceUrl?: string; operator?: string };
    }
  | { status: 'empty'; meta: { sourceUrl?: string; operator?: string } }
  | { status: 'error'; message: string };

export function SchedulePage({
  streetId,
  number,
  sector: sectorFromUrl,
}: {
  streetId: number;
  number: number;
  sector?: number;
}) {
  // Derive sector from URL query or fallback; streetName resolved from API below
  const [address, setAddress] = useState<Address>(() => ({
    streetId,
    street: '',
    number,
    sector: sectorFromUrl ?? 2,
  }));

  // Resolve street name + real sector on mount / when streetId changes
  useEffect(() => {
    let cancelled = false;
    getStreet(streetId)
      .then((s) => {
        if (cancelled || !s) return;
        setAddress((prev) => ({
          ...prev,
          streetId: s.id,
          street: s.name,
          sector: sectorFromUrl ?? s.sectors[0] ?? prev.sector,
        }));
      })
      .catch(() => {
        /* silent — keep URL-derived address */
      });
    return () => { cancelled = true; };
  }, [streetId, sectorFromUrl]);
  const [peekAddress, setPeekAddress] = useState<Address | null>(null);
  const [load, setLoad] = useState<LoadState>({ status: 'idle' });
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const activeAddress = peekAddress ?? address;

  const sectorInfo = getSector(activeAddress.sector);
  usePageMeta({
    title: `Program colectare ${activeAddress.street} nr. ${activeAddress.number}, Sector ${activeAddress.sector}`,
    description: `Programul colectării deșeurilor pentru ${activeAddress.street} nr. ${activeAddress.number}, Sectorul ${activeAddress.sector}, București. Sursă: ${sectorInfo?.operator.name ?? 'autoritatea locală'}.`,
    canonical: `https://cand-reciclam.madeinro.eu/adresa/${activeAddress.streetId}/${activeAddress.number}`,
  });

  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `${activeAddress.street} nr. ${activeAddress.number}`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: `${activeAddress.street} nr. ${activeAddress.number}`,
      addressLocality: 'București',
      addressRegion: `Sector ${activeAddress.sector}`,
      addressCountry: 'RO',
    },
    dateModified: FACTUAL_AS_OF,
  });

  // Recurring collection events from the operator's real RRULE data (only
  // once the schedule is loaded; nothing emitted for aggregated/manual data).
  useOptionalStructuredData(
    load.status === 'ok'
      ? buildScheduleJsonLd(load.rawSchedules, activeAddress, activeAddress.buildingType)
      : null,
  );

  useEffect(() => {
    if (!activeAddress.streetId) {
      setLoad({ status: 'empty', meta: {} });
      return;
    }
    setLoad({ status: 'loading' });
    getSchedule(activeAddress.streetId, activeAddress.number)
      .then((schedules) => {
        if (schedules.length === 0) {
          setLoad({ status: 'empty', meta: {} });
          return;
        }
        const first = schedules[0];
        setLoad({
          status: 'ok',
          pickups: buildPickups(schedules, activeAddress.buildingType),
          rawSchedules: schedules,
          meta: { sourceUrl: first?.sourceUrl ?? undefined, operator: first?.operator ?? undefined },
        });
      })
      .catch((e) => setLoad({ status: 'error', message: String(e) }));
  }, [activeAddress.streetId, activeAddress.number, activeAddress.buildingType]);

  useEffect(() => {
    if (load.status !== 'ok') return;
    setLoad({
      ...load,
      pickups: buildPickups(load.rawSchedules, activeAddress.buildingType),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAddress.buildingType]);

  const pickups = load.status === 'ok' ? load.pickups : [];
  const next = load.status === 'ok' ? load.pickups[0] ?? null : null;
  const availableBuildingTypes = load.status === 'ok' ? detectBuildingTypes(load.rawSchedules) : new Set<'case' | 'blocuri'>();
  const showBuildingToggle = availableBuildingTypes.size === 2;
  const loading = load.status === 'loading' || load.status === 'idle';
  const noData = load.status === 'empty' || load.status === 'error';

  function setBuildingType(bt: 'case' | 'blocuri') {
    if (peekAddress) {
      setPeekAddress({ ...peekAddress, buildingType: bt });
    } else {
      setAddress({ ...address, buildingType: bt });
    }
  }

  return (
    <div className="relative min-h-dvh">
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
        >
          <ArrowLeft size={14} /> Caută altă adresă
        </Link>
      </div>

      {peekAddress && (
        <PeekBar
          peekAddress={peekAddress}
          myAddress={address}
          onExit={() => setPeekAddress(null)}
        />
      )}

      <Hero
        address={activeAddress}
        next={next}
        pickups={pickups}
        loading={loading}
        noData={noData}
        sectorSource={sectorInfo ? { label: sectorInfo.operator.name, url: sectorInfo.operator.source.url } : undefined}
        onSwitchAddress={() => setSwitcherOpen(true)}
        onNotify={() => setNotifyOpen(true)}
        buildingTypeSelector={
          showBuildingToggle
            ? { value: activeAddress.buildingType, onChange: setBuildingType }
            : undefined
        }
      />
      <MiniMap address={activeAddress} />
      <CoverageNote sector={activeAddress.sector} />
      <Timeline pickups={pickups} loading={loading} />

      <section className="mx-auto max-w-3xl px-6 mt-10">
        <button
          onClick={() => setGuideOpen(true)}
          className="group w-full rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 text-left transition hover:border-[color:var(--color-accent)]"
        >
          <div className="flex items-center gap-4">
            <span className="shrink-0 inline-flex items-center justify-center size-11 rounded-2xl bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
              <Book size={18} />
            </span>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold">Ghid complet de sortare</h3>
              <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">
                Ce se pune și ce nu · unde predai bateriile, uleiul, medicamentele
              </p>
            </div>
          </div>
        </button>
      </section>

      <AddressSwitcher
        open={switcherOpen}
        currentAddress={activeAddress}
        onClose={() => setSwitcherOpen(false)}
        onSetAddress={(a) => {
          setAddress(a);
          setPeekAddress(null);
          navigate(`/adresa/${a.streetId}/${a.number}?sector=${a.sector}`);
        }}
        onPeekAddress={(a) => setPeekAddress(a)}
      />

      <NotifyDialog
        open={notifyOpen}
        onClose={() => setNotifyOpen(false)}
        address={activeAddress}
      />

      <GuideSheet open={guideOpen} onClose={() => setGuideOpen(false)} />

      <LegalFooter />
    </div>
  );
}

function expandSchedule(
  rrule: string,
  overrideDates: string[] | null,
  meta: {
    wasteType: WasteType;
    sourceQuality: SourceQuality;
    sourceUrl: string;
    operator: string;
    buildingType?: 'case' | 'blocuri' | null;
  },
  days = 14,
): Pickup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const horizon = new Date(today);
  horizon.setDate(horizon.getDate() + days);
  const out: Pickup[] = [];

  if (overrideDates && overrideDates.length > 0) {
    for (const key of overrideDates) {
      const [y, m, dd] = key.split('-').map(Number);
      if (!y || !m || !dd) continue;
      const d = new Date(y, m - 1, dd, 7, 0, 0, 0);
      if (d.getTime() < today.getTime() || d.getTime() >= horizon.getTime()) continue;
      out.push({
        date: d.toISOString(),
        wasteType: meta.wasteType,
        sourceQuality: meta.sourceQuality,
        sourceUrl: meta.sourceUrl,
        operator: meta.operator,
        buildingType: meta.buildingType ?? null,
      });
    }
    return out;
  }

  const byDayMatch = /BYDAY=([A-Z,]+)/.exec(rrule);
  if (!byDayMatch) return [];
  const byday = byDayMatch[1]!.split(',');
  const dayMap: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  const targetDays = new Set(byday.map((d) => dayMap[d]).filter((d): d is number => d !== undefined));
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    if (!targetDays.has(d.getDay())) continue;
    d.setHours(7, 0, 0, 0);
    out.push({
      date: d.toISOString(),
      wasteType: meta.wasteType,
      sourceQuality: meta.sourceQuality,
      sourceUrl: meta.sourceUrl,
      operator: meta.operator,
      buildingType: meta.buildingType ?? null,
    });
  }
  return out;
}

const SCHEMA_DAY: Record<string, string> = {
  MO: 'https://schema.org/Monday',
  TU: 'https://schema.org/Tuesday',
  WE: 'https://schema.org/Wednesday',
  TH: 'https://schema.org/Thursday',
  FR: 'https://schema.org/Friday',
  SA: 'https://schema.org/Saturday',
  SU: 'https://schema.org/Sunday',
};

/**
 * RRULE → schema.org Schedule. Returns null for anything we can't represent
 * faithfully (e.g. nth-weekday BYDAY like "1MO") — those schedules simply
 * don't emit JSON-LD rather than emitting something wrong.
 */
function rruleToSchemaSchedule(rrule: string): Record<string, unknown> | null {
  const parts = Object.fromEntries(
    rrule.split(';').map((p) => p.split('=') as [string, string]),
  );
  const interval = Number(parts.INTERVAL ?? '1');
  if (!Number.isFinite(interval) || interval < 1) return null;
  let repeatFrequency: string;
  if (parts.FREQ === 'WEEKLY') repeatFrequency = `P${interval}W`;
  else if (parts.FREQ === 'DAILY') repeatFrequency = `P${interval}D`;
  else if (parts.FREQ === 'MONTHLY') repeatFrequency = `P${interval}M`;
  else return null;
  let byDay: string[] | undefined;
  if (parts.BYDAY) {
    const tokens = parts.BYDAY.split(',');
    const mapped = tokens
      .map((d) => SCHEMA_DAY[d])
      .filter((d): d is string => Boolean(d));
    if (mapped.length !== tokens.length) return null;
    byDay = mapped;
  }
  return {
    '@type': 'Schedule',
    repeatFrequency,
    ...(byDay && byDay.length ? { byDay } : {}),
    scheduleTimezone: 'Europe/Bucharest',
  };
}

/**
 * Schema.org Event per waste type, built from the operator's real recurrence
 * rules (same filtering as buildPickups). Aggregated/manual entries whose
 * rrule can't be represented are skipped — no decorative data.
 */
function buildScheduleJsonLd(
  schedules: ApiSchedule[],
  addr: Address,
  filter?: 'case' | 'blocuri',
): unknown | null {
  const relevant = filter
    ? schedules.filter((s) => s.buildingType === filter || s.buildingType == null)
    : schedules;
  const seen = new Set<string>();
  const events: Record<string, unknown>[] = [];
  for (const s of relevant) {
    if (!s.rrule) continue;
    const key = `${s.wasteType}|${s.rrule}`;
    if (seen.has(key)) continue;
    const eventSchedule = rruleToSchemaSchedule(s.rrule);
    if (!eventSchedule) continue;
    seen.add(key);
    events.push({
      '@type': 'Event',
      name: `Colectare ${WASTE_LABEL[s.wasteType] ?? s.wasteType} — ${addr.street} nr. ${addr.number}, Sector ${addr.sector}, București`,
      eventSchedule,
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      location: {
        '@type': 'Place',
        address: {
          '@type': 'PostalAddress',
          streetAddress: `${addr.street} nr. ${addr.number}`,
          addressLocality: 'București',
          addressRegion: `Sector ${addr.sector}`,
          addressCountry: 'RO',
        },
      },
      ...(s.operator ? { organizer: { '@type': 'Organization', name: s.operator } } : {}),
      ...(s.sourceUrl ? { isBasedOn: s.sourceUrl } : {}),
    });
  }
  if (!events.length) return null;
  return { '@context': 'https://schema.org', '@graph': events };
}

function buildPickups(schedules: ApiSchedule[], filter?: 'case' | 'blocuri'): Pickup[] {
  const relevant = filter
    ? schedules.filter((s) => s.buildingType === filter || s.buildingType == null)
    : schedules;
  const all: Pickup[] = [];
  for (const s of relevant) {
    all.push(
      ...expandSchedule(s.rrule, s.overrideDates, {
        wasteType: s.wasteType,
        sourceQuality: s.sourceQuality,
        sourceUrl: s.sourceUrl ?? '#',
        operator: s.operator ?? 'Operator',
        buildingType: s.buildingType,
      }),
    );
  }
  all.sort((a, b) => a.date.localeCompare(b.date));
  return all;
}

function detectBuildingTypes(schedules: ApiSchedule[]): Set<'case' | 'blocuri'> {
  const types = new Set<'case' | 'blocuri'>();
  for (const s of schedules) {
    if (s.buildingType === 'case' || s.buildingType === 'blocuri') types.add(s.buildingType);
  }
  return types;
}
