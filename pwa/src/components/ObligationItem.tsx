import { AlertTriangle, Check, Clock, HelpCircle, Scale, Banknote } from 'lucide-react';
import type { Obligation, OfficialSource } from '../lib/sectors.js';
import { SourceCitation } from './SourceCitation.js';

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const months = [
    'ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie',
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

const STATUS_META = {
  met: {
    icon: Check,
    label: 'îndeplinit',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-500/30',
  },
  missed: {
    icon: AlertTriangle,
    label: 'termen depășit',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
    border: 'border-rose-500/35',
  },
  'in-progress': {
    icon: Clock,
    label: 'în derulare',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-500/30',
  },
  unknown: {
    icon: HelpCircle,
    label: 'status neverificat',
    dot: 'bg-slate-400',
    text: 'text-[color:var(--color-muted)]',
    border: 'border-[color:var(--color-border)]',
  },
} as const;

export function ObligationItem({
  obligation,
  evidence,
}: {
  obligation: Obligation;
  evidence?: Array<{ what: string; source: OfficialSource }>;
}) {
  const hasFinancialRisk = Boolean(obligation.financialRisk);

  return (
    <article className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] overflow-hidden">
      {/* Header: obligation title */}
      <header className="px-5 py-4 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)]">
        <div className="flex items-start gap-3">
          <span className="inline-flex items-center justify-center size-8 shrink-0 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)]">
            <Scale size={15} aria-hidden />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[color:var(--color-fg)] leading-snug">
              {obligation.title}
            </h3>
            <p className="mt-1 text-sm text-[color:var(--color-muted)] leading-relaxed">
              {obligation.summary}
            </p>
          </div>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4 text-sm">
        {/* Legal base */}
        <section>
          <h4 className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
            Bază legală
          </h4>
          <ul className="space-y-2">
            {obligation.legalBase.map((lb, i) => (
              <li key={i} className="flex flex-col gap-1">
                <span className="text-[color:var(--color-fg)]">{lb.law}</span>
                <SourceCitation source={lb.source} compact />
              </li>
            ))}
          </ul>
        </section>

        {/* Deadlines */}
        <section>
          <h4 className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
            Termene
          </h4>
          <ul className="space-y-1.5">
            {obligation.deadlines.map((d, i) => {
              const meta = d.status ? STATUS_META[d.status] : null;
              const Icon = meta?.icon;
              return (
                <li key={i} className="flex items-start gap-2.5">
                  {Icon && meta && (
                    <span className={`mt-0.5 inline-flex items-center justify-center size-5 shrink-0 rounded-full border ${meta.border}`}>
                      <Icon size={11} className={meta.text} aria-hidden />
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="font-mono tabular-nums text-[color:var(--color-fg)]">
                      {formatDate(d.date)}
                    </span>
                    <span className="text-[color:var(--color-muted)]"> · {d.description}</span>
                    {meta && (
                      <span className={`ml-1.5 text-xs ${meta.text}`}>({meta.label})</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Per-sector evidence */}
        {evidence && evidence.length > 0 && (
          <section className="rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface-tinted)] p-3">
            <h4 className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold mb-2">
              La nivelul sectorului
            </h4>
            <ul className="space-y-2">
              {evidence.map((e, i) => (
                <li key={i} className="space-y-1">
                  <p className="text-[color:var(--color-fg)] leading-relaxed">{e.what}</p>
                  <SourceCitation source={e.source} compact />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Financial risk block */}
        {hasFinancialRisk && obligation.financialRisk && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2.5">
              <Banknote size={16} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">
                  Risc financiar
                </h4>
                <p className="text-[color:var(--color-fg)] leading-relaxed">
                  {obligation.financialRisk.description}
                </p>
                <div className="mt-3 space-y-1.5">
                  <div className="text-xs uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
                    Status în timp real (surse vii)
                  </div>
                  <ul className="space-y-1.5">
                    {obligation.financialRisk.liveStatusSources.map((s, i) => (
                      <li key={i}>
                        <SourceCitation source={s} compact />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
