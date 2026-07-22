import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, ArrowRight, Loader2, Info } from 'lucide-react';
import { ALL_SECTORS, STATUS_META, type SectorInfo } from '../lib/sectors.js';
import { getSchedule, searchStreets, type StreetSearchResult } from '../lib/api.js';
import { Link, navigate } from '../lib/router.js';
import { LegalFooter } from '../components/LegalFooter.js';
import { usePageMeta, useStructuredData } from '../lib/meta.js';
import { WASTE_LABEL, type WasteType } from '../lib/types.js';
import { wasteTint } from '../components/WasteIcon.js';
import { OpenAILogo } from '../components/OpenAILogo.js';
import { proximityLabel } from '../lib/time.js';

export function LandingPage() {
  usePageMeta({
    title: 'Când reciclăm? · Programul colectării deșeurilor în București',
    description:
      'Programul colectării deșeurilor per adresă în București, cu surse oficiale. Date publicate de Romprest (S1) și Supercom (S2). Transparență pentru celelalte sectoare.',
    canonical: 'https://cand-reciclam.madeinro.eu/',
  });

  useStructuredData({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Când reciclăm?',
    url: 'https://cand-reciclam.madeinro.eu/',
    description:
      'Programul colectării deșeurilor per adresă în București, cu surse oficiale.',
    inLanguage: 'ro',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cand-reciclam.madeinro.eu/?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  });

  return (
    <>
      <main className="relative min-h-dvh overflow-hidden">
        <div className="ambient-mesh" aria-hidden style={{
          '--mesh-a': 'oklch(70% 0.08 150)',
          '--mesh-b': 'oklch(55% 0.12 140)',
          '--mesh-c': 'oklch(60% 0.06 170)',
        } as React.CSSProperties} />
        <div className="grain absolute inset-0 pointer-events-none" aria-hidden />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pt-16 md:pt-24 pb-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(300px,360px)] lg:items-start">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.02]">
                  Când reciclăm?
                </h1>
                <p className="mt-4 text-lg md:text-xl text-[color:var(--color-muted)] leading-relaxed max-w-2xl">
                  Programul colectării deșeurilor per adresă în București — cu sursele
                  oficiale pentru fiecare afirmație.
                </p>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/90 px-3.5 py-1.5 text-sm text-[color:var(--color-muted)]">
                  <span className="size-1.5 rounded-full bg-[color:var(--color-accent)]" aria-hidden />
                  Gratuit · Fără cont · Funcționează offline
                </p>
                <p className="mt-3 flex flex-wrap items-center gap-2.5">
                  <a
                    href="https://chatgpt.com/plugins/plugin_asdk_app_6a5a1e1c646881919ea3a47685739b06"
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-accent)]/50 bg-[color:var(--color-surface-tinted)] px-4 py-2 text-sm font-semibold text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)] transition"
                  >
                    <OpenAILogo className="w-5 h-5 shrink-0 text-[color:var(--color-accent)]" />
                    Evaluat și aprobat de OpenAI — încearcă în ChatGPT acum
                  </a>
                  <Link
                    to="/chatgpt"
                    className="text-sm text-[color:var(--color-muted)] underline underline-offset-2 hover:text-[color:var(--color-fg)] transition"
                  >
                    detalii
                  </Link>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="mt-10 md:mt-12"
              >
                <StreetSearch />
              </motion.div>
            </div>

            <ExamplePreview />
          </div>

          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-16"
          >
            <h2 className="text-sm uppercase tracking-[0.18em] text-[color:var(--color-muted)] font-semibold mb-2">
              Acoperirea datelor oficiale
            </h2>
            <p className="text-base text-[color:var(--color-fg)] mb-5 max-w-3xl">
              În București, <strong>doar 2 din 6 sectoare</strong> publică oficial
              programul per adresă. Pentru celelalte, autoritățile oferă frecvențe
              generale, direcționează spre aplicații partenere, sau nu publică date
              online. Mai jos, situația factuală.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ALL_SECTORS.map((s) => (
                <SectorCard key={s.id} sector={s} />
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="mt-14 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6"
          >
            <h2 className="flex items-center gap-2 text-base font-semibold">
              <Info size={18} className="text-[color:var(--color-accent)]" />
              Metodologie
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--color-muted)]">
              Pentru S1 și S2 preluăm automat datele publicate de Romprest
              (programe.romprest.eu) și Supercom (impozitelocale2.ro/gunoi). Pentru
              restul sectoarelor, agregăm surse oficiale publicate de operatori și
              primării — fiecare afirmație e linkată la sursă cu data verificării.
              Nu inventăm și nu aproximăm.
            </p>
            <Link
              to="/despre"
              className="mt-4 inline-flex items-center gap-1.5 text-sm text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-strong)] font-medium"
            >
              Citește despre metodologie
              <ArrowRight size={14} />
            </Link>
          </motion.section>
        </div>
      </main>
      <LegalFooter />
    </>
  );
}

// The result-preview card: one REAL address with its REAL published schedule,
// fetched live from our own API so it always matches what search would show.
// If the API has nothing for it, the card simply doesn't render — no theater.
const EXAMPLE = {
  streetId: 600,
  number: 100,
  sector: 1,
  street: 'Ion Mihalache',
  to: '/adresa/600/100?sector=1',
};
const RRULE_DAY: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
const DAY_LC = ['duminică', 'luni', 'marți', 'miercuri', 'joi', 'vineri', 'sâmbătă'];

function ExamplePreview() {
  const [rows, setRows] = useState<{ wasteType: WasteType; days: number[] }[]>([]);
  const [next, setNext] = useState<{ iso: string; wasteType: WasteType } | null>(null);
  const [operator, setOperator] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getSchedule(EXAMPLE.streetId, EXAMPLE.number)
      .then((schedules) => {
        if (!alive || schedules.length === 0) return;
        const byType = new Map<WasteType, Set<number>>();
        for (const s of schedules) {
          const m = /BYDAY=([A-Z,]+)/.exec(s.rrule ?? '');
          if (!m) continue;
          const days = m[1]!
            .split(',')
            .map((d) => RRULE_DAY[d])
            .filter((d): d is number => d !== undefined);
          if (days.length === 0) continue;
          if (!byType.has(s.wasteType)) byType.set(s.wasteType, new Set());
          for (const d of days) byType.get(s.wasteType)!.add(d);
        }
        if (byType.size === 0) return;
        const parsed = [...byType.entries()].map(([wasteType, ds]) => ({
          wasteType,
          days: [...ds].sort((a, b) => a - b),
        }));
        // Next pickup across all fractions, same day-walking logic as the
        // schedule page (07:00 local, today included).
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        outer: for (let i = 0; i < 8; i++) {
          const d = new Date(today);
          d.setDate(d.getDate() + i);
          for (const r of parsed) {
            if (r.days.includes(d.getDay())) {
              d.setHours(7, 0, 0, 0);
              setNext({ iso: d.toISOString(), wasteType: r.wasteType });
              break outer;
            }
          }
        }
        setOperator(schedules[0]?.operator ?? null);
        setRows(parsed);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (rows.length === 0) return null;
  const prox = next ? proximityLabel(next.iso) : null;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.35 }}
      aria-label="Exemplu de rezultat"
    >
      <div className="text-xs uppercase tracking-[0.18em] text-[color:var(--color-muted)] font-semibold mb-2">
        Exemplu real — ce primești
      </div>
      <Link
        to={EXAMPLE.to}
        className="group block rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-accent)] hover:shadow-[0_8px_24px_-12px_oklch(20%_0.04_160/0.25)]"
      >
        <div className="flex items-center gap-2 text-[15px] font-medium">
          <MapPin size={15} className="text-[color:var(--color-accent)] shrink-0" aria-hidden />
          <span className="truncate">{EXAMPLE.street}</span>
          <span className="font-mono tabular-nums text-[color:var(--color-accent-strong)]">
            nr. {EXAMPLE.number}
          </span>
          <span className="text-sm text-[color:var(--color-muted)]">· S{EXAMPLE.sector}</span>
        </div>

        {prox && next && (
          <div className="mt-4 rounded-2xl bg-[color:var(--color-fg)]/[0.04] px-4 py-3">
            <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
              Următoarea colectare
            </div>
            <div className="mt-0.5 text-lg font-semibold leading-tight">
              {prox.label}
              <span className="text-[color:var(--color-muted)] font-normal">
                {' '}
                · {WASTE_LABEL[next.wasteType].toLowerCase()}
              </span>
            </div>
          </div>
        )}

        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => (
            <li key={r.wasteType} className="flex items-start gap-2.5 text-sm">
              <span
                className="mt-1.5 size-2.5 shrink-0 rounded-full"
                style={{ background: wasteTint(r.wasteType) }}
                aria-hidden
              />
              <span>
                <span className="font-medium">{WASTE_LABEL[r.wasteType]}</span>
                <span className="text-[color:var(--color-muted)]">
                  {' — '}
                  {r.days.map((d) => DAY_LC[d]).join(', ')}
                </span>
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-3 text-sm">
          <span className="text-[color:var(--color-muted)]">
            Sursă: {operator ?? 'operator'} — program oficial per stradă și număr
          </span>
          <span className="inline-flex shrink-0 items-center gap-1 text-[color:var(--color-accent)] font-medium group-hover:text-[color:var(--color-accent-strong)]">
            Vezi adresa
            <ArrowRight size={13} aria-hidden />
          </span>
        </div>
      </Link>
    </motion.aside>
  );
}

function StreetSearch() {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StreetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  function onQChange(value: string) {
    setQ(value);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const v = value;
    setTimeout(async () => {
      if (v !== value) return;
      try {
        const r = await searchStreets(v);
        setResults(r);
      } finally {
        setLoading(false);
      }
    }, 180);
  }

  function pick(r: StreetSearchResult) {
    const sector = r.sectors[0] ?? 2;
    const defaultNumber = r.numberRange?.from ?? 1;
    if (r.segmentCount === 1 && r.sectors.length === 1) {
      navigate(`/adresa/${r.id}/${defaultNumber}?sector=${sector}`);
    } else {
      // Ask number
      const input = window.prompt(`Ce număr pe ${r.name}?`, String(defaultNumber));
      if (input == null) return;
      const n = Number(input) || defaultNumber;
      navigate(`/adresa/${r.id}/${n}?sector=${sector}`);
    }
  }

  return (
    <div>
      <label className="block text-sm text-[color:var(--color-muted)] mb-2 font-medium">
        Caută adresa ta
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3.5 focus-within:border-[color:var(--color-accent)] transition max-w-xl">
        <Search size={18} className="text-[color:var(--color-muted)]" aria-hidden />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          placeholder="ex. Mosilor, Stefan cel Mare, Ion Mihalache…"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          className="flex-1 bg-transparent outline-none text-base placeholder:text-[color:var(--color-subtle)]"
        />
        {loading && <Loader2 size={16} className="animate-spin text-[color:var(--color-muted)]" />}
      </div>

      {results.length > 0 && (
        <ul className="mt-2 max-w-xl rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
          {results.map((r) => (
            <li key={r.id}>
              <button
                onClick={() => pick(r)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[color:var(--color-fg)]/5 transition"
              >
                <MapPin size={15} className="text-[color:var(--color-accent)] shrink-0" aria-hidden />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.name}</div>
                  <div className="text-sm text-[color:var(--color-muted)]">
                    {r.sectors.length > 1
                      ? `Sectoarele ${r.sectors.sort().join(', ')}`
                      : `Sector ${r.sectors[0] ?? '?'}`}
                    {r.numberRange && (
                      <span className="font-mono ml-1">· nr. {r.numberRange.from}–{r.numberRange.to ?? '∞'}</span>
                    )}
                  </div>
                </div>
                <ArrowRight size={14} className="text-[color:var(--color-muted)]" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {q.length >= 2 && !loading && results.length === 0 && (
        <p className="mt-3 max-w-xl text-sm text-[color:var(--color-muted)]">
          Nu am găsit „{q}" în datele publicate (S1 + S2). Dacă strada ta e în alt
          sector, vezi situația sectorului mai jos.
        </p>
      )}
    </div>
  );
}

function SectorCard({ sector }: { sector: SectorInfo }) {
  const meta = STATUS_META[sector.status];
  return (
    <Link
      to={`/sector/${sector.id}`}
      className="group rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5 transition hover:border-[color:var(--color-accent)] hover:shadow-[0_8px_24px_-12px_oklch(20%_0.04_160/0.25)]"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
            Sector
          </div>
          <div className="text-3xl font-semibold leading-none mt-1">{sector.id}</div>
        </div>
        <span
          className={`text-xs uppercase tracking-wider font-semibold rounded-full border px-2.5 py-1 ${meta.chipClass}`}
        >
          {meta.label}
        </span>
      </div>
      <div className="text-sm font-medium text-[color:var(--color-fg)]">
        {sector.operator.name}
      </div>
      <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-snug">
        {sector.statusSummary}
      </p>
      <div className="mt-3 inline-flex items-center gap-1 text-sm text-[color:var(--color-accent)] font-medium group-hover:text-[color:var(--color-accent-strong)]">
        Vezi detalii
        <ArrowRight size={13} aria-hidden />
      </div>
    </Link>
  );
}
