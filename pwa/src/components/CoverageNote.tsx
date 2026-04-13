import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ChevronDown, ExternalLink, CheckCircle2, Circle } from 'lucide-react';
import { getCoverage } from '../lib/coverage.js';
import { WASTE_LABEL, type WasteType } from '../lib/types.js';
import { wasteTint } from './WasteIcon.js';

const ALL_WASTE: WasteType[] = ['menajer', 'reciclabil_uscat', 'bio', 'sticla', 'voluminoase', 'deee', 'textile'];

export function CoverageNote({ sector }: { sector: number }) {
  const [open, setOpen] = useState(false);
  const coverage = getCoverage(sector);
  if (!coverage) return null;

  const coveredSet = new Set(coverage.covered);

  return (
    <section className="mx-auto max-w-2xl px-6 mt-8">
      <div className="rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-start gap-3 p-5 text-left hover:bg-[color:var(--color-fg)]/5 transition"
          aria-expanded={open}
        >
          <span className="shrink-0 inline-flex items-center justify-center size-9 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)] mt-0.5">
            <Info size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold">
                Ce date avem pentru Sectorul {coverage.sector}
              </h3>
              <span className="text-sm text-[color:var(--color-muted)]">· {coverage.operator}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ALL_WASTE.map((w) => {
                const covered = coveredSet.has(w);
                const tint = wasteTint(w);
                return (
                  <span
                    key={w}
                    className={`inline-flex items-center gap-1.5 text-sm rounded-full px-3 py-1.5 border transition`}
                    style={
                      covered
                        ? {
                            background: `color-mix(in oklch, ${tint} 20%, var(--color-surface))`,
                            borderColor: `color-mix(in oklch, ${tint} 55%, transparent)`,
                            // mix with fg (adaptive) — 35% fg weight for stronger contrast
                            color: `color-mix(in oklch, ${tint} 35%, var(--color-fg))`,
                            fontWeight: 600,
                          }
                        : {
                            background: 'var(--color-surface)',
                            borderColor: 'var(--color-border)',
                            color: 'var(--color-muted)',
                            textDecoration: 'line-through',
                            textDecorationThickness: '1.5px',
                            textDecorationColor: 'var(--color-muted)',
                          }
                    }
                  >
                    {covered ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                    {WASTE_LABEL[w]}
                  </span>
                );
              })}
            </div>
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 text-[color:var(--color-muted)] mt-1.5"
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-[color:var(--color-border)]"
            >
              <div className="p-5 space-y-3 text-[15px] leading-relaxed text-[color:var(--color-fg)]">
                {coverage.notCoveredExplanation.map((line, i) => (
                  <p
                    key={i}
                    className={line.startsWith('•') ? 'pl-2 text-[color:var(--color-muted)]' : 'text-[color:var(--color-muted)]'}
                  >
                    {line.startsWith('•') ? (
                      <>
                        <span className="text-[color:var(--color-accent)]">•</span>
                        <span> {line.slice(1).trim()}</span>
                      </>
                    ) : (
                      line
                    )}
                  </p>
                ))}

                <div className="pt-3 border-t border-[color:var(--color-border)]">
                  <div className="text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
                    surse oficiale
                  </div>
                  <ul className="space-y-1.5">
                    {coverage.resources.map((r) => (
                      <li key={r.url}>
                        <a
                          href={r.url}
                          target={r.url.startsWith('http') ? '_blank' : undefined}
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[15px] text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-strong)] transition"
                        >
                          <ExternalLink size={11} />
                          {r.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
