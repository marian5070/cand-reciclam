import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { searchStreets, type StreetSearchResult } from '../lib/api.js';
import type { Address } from '../lib/types.js';

export function Onboarding({ onComplete }: { onComplete: (a: Address) => void }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StreetSearchResult[]>([]);
  const [selected, setSelected] = useState<StreetSearchResult | null>(null);
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (selected) return;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancel = false;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const r = await searchStreets(q);
        if (!cancel) setResults(r);
      } finally {
        if (!cancel) setLoading(false);
      }
    }, 180);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [q, selected]);

  const needsNumber = selected && selected.segmentCount > 1;
  // When selected is a free-text fallback (id=0, no sectors known), user must pick a sector manually
  const needsSectorPick = selected && selected.id === 0;
  const [manualSector, setManualSector] = useState<number | null>(null);
  const canSubmit = selected && (!needsSectorPick || manualSector !== null) && (!needsNumber || !!number);

  function handleSelect(r: StreetSearchResult) {
    setSelected(r);
    setManualSector(null);
  }

  function handleSubmit() {
    if (!selected) return;
    const n = Number(number) || (selected.numberRange?.from ?? 1);
    const sector = needsSectorPick
      ? (manualSector ?? 2)
      : (selected.sectors[0] ?? 2);
    onComplete({
      streetId: selected.id,
      street: selected.name,
      number: n,
      sector,
    });
  }

  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="ambient-mesh" aria-hidden style={{
        '--mesh-a': 'oklch(70% 0.08 150)',
        '--mesh-b': 'oklch(55% 0.12 140)',
        '--mesh-c': 'oklch(60% 0.06 170)',
      } as React.CSSProperties} />
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-xl px-6 pt-16 md:pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.05]">
            Bună.
          </h1>
          <p className="mt-3 text-lg text-[color:var(--color-muted)] leading-relaxed">
            Pe ce stradă locuiești?
          </p>
          <p className="mt-2 text-base text-[color:var(--color-muted)]">
            Îți spunem când se ridică gunoiul pe adresa ta și te anunțăm cu o seară înainte.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10"
        >
          {!selected && (
            <div className="relative">
              <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 backdrop-blur-xl px-4 py-3.5 focus-within:border-[color:var(--color-accent)] transition">
                <Search size={18} className="text-[color:var(--color-muted)]" />
                <input
                  ref={inputRef}
                  type="text"
                  inputMode="search"
                  autoComplete="off"
                  placeholder="ex. Calea Moșilor, Aviatorilor, Splaiul..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-lg placeholder:text-[color:var(--color-muted)]/60"
                />
                {loading && <Loader2 size={16} className="animate-spin text-[color:var(--color-muted)]" />}
              </div>

              <AnimatePresence>
                {results.length > 0 && (
                  <motion.ul
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/95 backdrop-blur-xl overflow-hidden shadow-[0_8px_32px_-12px_oklch(30%_0.05_160/0.2)]"
                  >
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => handleSelect(r)}
                          className="group flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[color:var(--color-fg)]/5 transition"
                        >
                          <MapPin size={15} className="text-[color:var(--color-accent)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{r.name}</div>
                            <div className="text-xs text-[color:var(--color-muted)] mt-0.5">
                              {r.sectors.length > 1
                                ? `Sectoarele ${r.sectors.sort().join(', ')}`
                                : `Sector ${r.sectors[0] ?? '?'}`}
                              {r.numberRange && (
                                <span className="font-mono ml-1">· nr. {r.numberRange.from}–{r.numberRange.to ?? '∞'}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight size={14} className="text-[color:var(--color-muted)] opacity-0 group-hover:opacity-100 transition" />
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>

              {q.length >= 2 && !loading && results.length === 0 && (
                <div className="mt-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)] p-4">
                  <p className="text-sm text-[color:var(--color-fg)]">
                    Strada „<strong>{q}</strong>" nu e în datele pe care le avem per adresă. Continuă oricum?
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                    Îți arătăm info generală pentru sectorul tău + linkuri oficiale spre operator.
                  </p>
                  <button
                    onClick={() => {
                      setSelected({
                        id: 0,
                        name: q,
                        slug: '',
                        sectors: [],
                        numberRange: null,
                        segmentCount: 0,
                      });
                    }}
                    className="mt-3 cta-primary text-sm"
                  >
                    <ArrowRight size={14} />
                    Continuă cu „{q}"
                  </button>
                </div>
              )}

              {q.length < 2 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="text-sm text-[color:var(--color-muted)] mr-1 self-center">exemple:</span>
                  {['Mosilor', 'Stefan', 'Pache', 'Obor'].map((ex) => (
                    <button
                      key={ex}
                      onClick={() => setQ(ex)}
                      className="text-xs rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 px-3 py-1 text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)] transition"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selected && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-5"
            >
              <button
                onClick={() => { setSelected(null); setNumber(''); setResults([]); }}
                className="inline-flex items-center gap-2 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
              >
                <CheckCircle2 size={16} className="text-[color:var(--color-accent)]" />
                <span className="font-medium text-[color:var(--color-fg)]">{selected.name}</span>
                <span>· schimbă</span>
              </button>

              <div>
                <label className="block text-sm text-[color:var(--color-muted)] mb-2">
                  {needsNumber ? 'Ce număr? (strada trece prin mai multe sectoare)' : 'Ce număr? (opțional)'}
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="91"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="w-full rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 backdrop-blur-xl px-4 py-3.5 text-lg font-mono tabular-nums outline-none focus:border-[color:var(--color-accent)] transition"
                />
              </div>

              {needsSectorPick && (
                <div>
                  <label className="block text-sm text-[color:var(--color-muted)] mb-2">
                    În ce sector e strada? <span className="text-[color:var(--color-subtle)]">(ne spui tu, ca să-ți arătăm info corect)</span>
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((s) => (
                      <button
                        key={s}
                        onClick={() => setManualSector(s)}
                        className={`rounded-2xl border py-3 text-base font-semibold transition ${
                          manualSector === s
                            ? 'bg-[color:var(--color-fg)] text-[color:var(--color-bg)] border-[color:var(--color-fg)]'
                            : 'bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)]'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="cta-primary w-full justify-center py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuă
                <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 text-xs text-[color:var(--color-muted)]"
        >
          Datele tale rămân pe dispozitivul tău. Nu cerem cont, telefon sau email.
        </motion.p>
      </div>
    </main>
  );
}
