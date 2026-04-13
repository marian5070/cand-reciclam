import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, XCircle, Info, ExternalLink, ChevronDown, MapPin, Book } from 'lucide-react';
import { GUIDE, type GuideEntry } from '../lib/guide.js';
import { WasteIcon, wasteTint } from './WasteIcon.js';

export function GuideSheet({
  open,
  onClose,
  initialId,
}: {
  open: boolean;
  onClose: () => void;
  initialId?: string;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(initialId ?? null);

  useEffect(() => {
    if (open && initialId) setExpandedId(initialId);
  }, [open, initialId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[oklch(10%_0.015_162/0.65)] backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full md:max-w-2xl h-[92dvh] md:h-[88dvh] rounded-t-3xl md:rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] shadow-[0_-20px_48px_-12px_oklch(10%_0.05_160/0.4)] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[color:var(--color-border)]">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center size-9 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
                  <Book size={16} />
                </span>
                <div>
                  <h2 className="text-base font-semibold">Ghid de sortare</h2>
                  <p className="text-sm text-[color:var(--color-muted)]">
                    {GUIDE.length} categorii · ce se pune, ce NU, unde se predă
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Închide"
                className="rounded-lg p-2 text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
              {GUIDE.map((g) => (
                <GuideCard
                  key={g.id}
                  entry={g}
                  expanded={expandedId === g.id}
                  onToggle={() => setExpandedId(expandedId === g.id ? null : g.id)}
                />
              ))}

              <div className="pt-4 text-center text-sm text-[color:var(--color-muted)]">
                Sursa generală: <a href="https://hartareciclarii.ro/bucuresti/" target="_blank" rel="nofollow noopener noreferrer" className="underline hover:text-[color:var(--color-fg)]">Harta Reciclării București</a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GuideCard({ entry, expanded, onToggle }: { entry: GuideEntry; expanded: boolean; onToggle: () => void }) {
  const tint = entry.wasteType ? wasteTint(entry.wasteType) : 'oklch(55% 0.08 150)';
  return (
    <article
      data-testid="guide-card"
      className={`rounded-3xl border overflow-hidden transition-all ${expanded ? 'shadow-[0_8px_28px_-12px_oklch(20%_0.04_160/0.25)]' : ''}`}
      style={{
        borderColor: expanded ? `color-mix(in oklch, ${tint} 35%, transparent)` : 'var(--color-border)',
        background: expanded
          ? `color-mix(in oklch, ${tint} 5%, var(--color-surface))`
          : 'var(--color-surface)',
      }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start gap-4 text-left p-4 hover:bg-[color:var(--color-fg)]/5 transition"
        aria-expanded={expanded}
      >
        {entry.wasteType ? (
          <WasteIcon type={entry.wasteType} size={24} />
        ) : (
          <span className="inline-flex items-center justify-center size-9 rounded-xl"
            style={{
              background: `color-mix(in oklch, ${tint} 12%, transparent)`,
              color: tint,
            }}>
            <Info size={18} />
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-base font-semibold">{entry.title}</h3>
            {entry.binColor && (
              <span
                className="text-xs uppercase tracking-wider rounded-full px-2.5 py-1 font-semibold border"
                style={{
                  background: `color-mix(in oklch, ${tint} 18%, var(--color-surface))`,
                  borderColor: `color-mix(in oklch, ${tint} 45%, transparent)`,
                  // adaptive: blends tint with --color-fg so text is readable in both modes
                  color: `color-mix(in oklch, ${tint} 35%, var(--color-fg))`,
                }}
              >
                pubelă {entry.binColor}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm text-[color:var(--color-muted)]">{entry.shortTag}</p>
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-[color:var(--color-muted)] mt-1"
        >
          <ChevronDown size={16} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-5 space-y-5 text-[15px] leading-relaxed">
              {/* Accepts */}
              <div>
                <h4 className="flex items-center gap-2 text-xs uppercase tracking-wider text-emerald-600 font-medium mb-2">
                  <Check size={12} /> Se pune
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {entry.accepts.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-emerald-500 shrink-0">+</span>
                      <span className="text-[color:var(--color-fg)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Rejects */}
              <div>
                <h4 className="flex items-center gap-2 text-xs uppercase tracking-wider text-rose-600 font-medium mb-2">
                  <XCircle size={12} /> NU se pune
                </h4>
                <ul className="space-y-1.5 pl-1">
                  {entry.rejects.map((item, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-rose-500 shrink-0">−</span>
                      <span className="text-[color:var(--color-fg)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Preparation */}
              {entry.prep && entry.prep.length > 0 && (
                <div>
                  <h4 className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-600 font-medium mb-2">
                    <Info size={12} /> Pregătire
                  </h4>
                  <ul className="space-y-1.5 pl-1">
                    {entry.prep.map((item, i) => (
                      <li key={i} className="text-[color:var(--color-muted)]">· {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disposal points */}
              {entry.disposal && (
                <div className="rounded-2xl bg-[color:var(--color-surface-tinted)] border border-[color:var(--color-border)] p-4">
                  <h4 className="flex items-center gap-2 text-xs uppercase tracking-wider text-[color:var(--color-accent-strong)] font-medium mb-2">
                    <MapPin size={12} /> {entry.disposal.headline}
                  </h4>
                  <ul className="space-y-2">
                    {entry.disposal.points.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="shrink-0 size-1.5 rounded-full mt-2 bg-[color:var(--color-sage-500)]" />
                        <div>
                          <div className="text-sm font-medium">
                            {p.url ? (
                              <a
                                href={p.url}
                                target={p.url.startsWith('http') ? '_blank' : undefined}
                                rel={p.url.startsWith('http') ? 'nofollow noopener noreferrer' : undefined}
                                className="hover:text-[color:var(--color-accent-strong)] inline-flex items-center gap-1"
                              >
                                {p.name} <ExternalLink size={11} className="opacity-60" />
                              </a>
                            ) : (
                              p.name
                            )}
                          </div>
                          <div className="text-sm text-[color:var(--color-muted)] leading-snug mt-0.5">{p.description}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}
