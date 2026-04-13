import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, X, Home, Eye, Loader2, ArrowRight } from 'lucide-react';
import { searchStreets, type StreetSearchResult } from '../lib/api.js';
import type { Address } from '../lib/types.js';

type Mode = 'set' | 'peek';

export function AddressSwitcher({
  open,
  currentAddress,
  onClose,
  onSetAddress,
  onPeekAddress,
}: {
  open: boolean;
  currentAddress: Address;
  onClose: () => void;
  onSetAddress: (a: Address) => void;
  onPeekAddress: (a: Address) => void;
}) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<StreetSearchResult[]>([]);
  const [selected, setSelected] = useState<StreetSearchResult | null>(null);
  const [number, setNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>('peek');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ('');
    setResults([]);
    setSelected(null);
    setNumber('');
    setMode('peek');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (selected || q.trim().length < 2) {
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

  function submit() {
    if (!selected) return;
    const n = Number(number) || (selected.numberRange?.from ?? 1);
    const addr: Address = {
      streetId: selected.id,
      street: selected.name,
      number: n,
      sector: selected.sectors[0] ?? 2,
    };
    if (mode === 'set') onSetAddress(addr);
    else onPeekAddress(addr);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-[oklch(10%_0.015_162/0.55)] p-4 pt-8 md:pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_24px_60px_-12px_oklch(10%_0.05_160/0.55)] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[color:var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center justify-center size-7 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
                  <MapPin size={14} />
                </span>
                <div>
                  <div className="text-sm font-medium">Caută altă adresă</div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {currentAddress.street} nr. {currentAddress.number}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Închide"
                className="rounded-lg p-1.5 text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            {!selected && (
              <div className="p-5">
                <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 focus-within:border-[color:var(--color-accent)] transition">
                  <Search size={16} className="text-[color:var(--color-muted)]" />
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="search"
                    autoComplete="off"
                    placeholder="nume stradă..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="flex-1 bg-transparent outline-none text-base placeholder:text-[color:var(--color-subtle)]"
                  />
                  {loading && <Loader2 size={14} className="animate-spin text-[color:var(--color-muted)]" />}
                </div>

                {results.length > 0 && (
                  <ul className="mt-2 max-h-[340px] overflow-y-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
                    {results.map((r) => (
                      <li key={r.id}>
                        <button
                          onClick={() => setSelected(r)}
                          className="group flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[color:var(--color-fg)]/5 transition"
                        >
                          <MapPin size={13} className="text-[color:var(--color-accent)] shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">{r.name}</div>
                            <div className="text-sm text-[color:var(--color-muted)] mt-0.5">
                              {r.sectors.length > 1
                                ? `Sectoarele ${r.sectors.sort().join(', ')}`
                                : `Sector ${r.sectors[0] ?? '?'}`}
                              {r.numberRange && (
                                <span className="font-mono ml-1">· nr. {r.numberRange.from}–{r.numberRange.to ?? '∞'}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight size={13} className="text-[color:var(--color-muted)] opacity-0 group-hover:opacity-100 transition" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {q.length >= 2 && !loading && results.length === 0 && (
                  <p className="mt-3 text-xs text-[color:var(--color-muted)]">Niciun rezultat pentru „{q}".</p>
                )}
              </div>
            )}

            {selected && (
              <div className="p-5 space-y-4">
                <button
                  onClick={() => { setSelected(null); setNumber(''); }}
                  className="inline-flex items-center gap-2 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
                >
                  ← <span className="font-medium text-[color:var(--color-fg)]">{selected.name}</span>
                </button>

                <div>
                  <label className="block text-sm text-[color:var(--color-muted)] mb-1.5">
                    {needsNumber ? 'Număr (strada trece prin mai multe sectoare)' : 'Număr (opțional)'}
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="ex. 91"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5 text-base font-mono tabular-nums outline-none focus:border-[color:var(--color-accent)] transition"
                  />
                </div>

                {/* Mode selector */}
                <fieldset className="space-y-2">
                  <legend className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] mb-1">ce faci?</legend>
                  <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${mode === 'peek' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-surface-tinted)]' : 'border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50'}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="peek"
                      checked={mode === 'peek'}
                      onChange={() => setMode('peek')}
                      className="sr-only"
                    />
                    <Eye size={16} className="mt-0.5 shrink-0 text-[color:var(--color-accent)]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Doar verifică</div>
                      <div className="text-sm text-[color:var(--color-muted)] mt-0.5">
                        Vezi temporar programul pentru această adresă. Adresa ta rămâne neschimbată.
                      </div>
                    </div>
                  </label>
                  <label className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${mode === 'set' ? 'border-[color:var(--color-accent)] bg-[color:var(--color-surface-tinted)]' : 'border-[color:var(--color-border)] hover:border-[color:var(--color-accent)]/50'}`}>
                    <input
                      type="radio"
                      name="mode"
                      value="set"
                      checked={mode === 'set'}
                      onChange={() => setMode('set')}
                      className="sr-only"
                    />
                    <Home size={16} className="mt-0.5 shrink-0 text-[color:var(--color-accent)]" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Setează ca adresa mea</div>
                      <div className="text-sm text-[color:var(--color-muted)] mt-0.5">
                        Înlocuiește adresa curentă. Viitoarele notificări vor veni pentru această adresă.
                      </div>
                    </div>
                  </label>
                </fieldset>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={onClose}
                    className="flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:bg-[color:var(--color-fg)]/5 transition"
                  >
                    Anulează
                  </button>
                  <button
                    onClick={submit}
                    disabled={Boolean(needsNumber && !number)}
                    className="cta-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mode === 'set' ? 'Setează' : 'Verifică'}
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function PeekBar({
  peekAddress,
  myAddress,
  onExit,
}: {
  peekAddress: Address;
  myAddress: Address;
  onExit: () => void;
}) {
  return (
    <motion.div
      initial={{ y: -44 }}
      animate={{ y: 0 }}
      exit={{ y: -44 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-30 flex items-center justify-center bg-[color:var(--color-sage-500)] text-white text-sm px-4 py-2.5 gap-3"
    >
      <Eye size={14} />
      <span className="flex items-center gap-1.5 min-w-0">
        <span className="opacity-90 hidden sm:inline">vezi temporar:</span>
        <strong className="truncate">{peekAddress.street} nr. {peekAddress.number}</strong>
      </span>
      <button
        onClick={onExit}
        className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 transition px-3 py-1 text-xs font-medium"
      >
        înapoi la {myAddress.street.length > 14 ? myAddress.street.slice(0, 14) + '…' : myAddress.street}
        <X size={12} />
      </button>
    </motion.div>
  );
}
