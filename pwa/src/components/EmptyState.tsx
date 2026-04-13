import { motion } from 'framer-motion';
import { MapPin, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react';
import type { Address } from '../lib/types.js';
import { CoverageNote } from './CoverageNote.js';

export function EmptyState({
  address,
  sourceUrl,
  sourceLabel,
  onSwitchAddress,
}: {
  address: Address;
  sourceUrl?: string;
  sourceLabel?: string;
  onSwitchAddress?: () => void;
}) {
  return (
    <section className="relative overflow-hidden isolate pt-8 pb-14 md:pt-14 md:pb-20">
      <div className="ambient-mesh" aria-hidden />
      <div className="grain absolute inset-0 pointer-events-none" aria-hidden />

      <div className="relative z-10 mx-auto max-w-2xl px-6">
        <motion.button
          onClick={onSwitchAddress}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/70 backdrop-blur-xl px-4 py-2 text-sm text-[color:var(--color-muted)] hover:border-[color:var(--color-accent)] hover:text-[color:var(--color-fg)] transition"
        >
          <MapPin size={14} />
          <span className="font-medium">{address.street}</span>
          <span className="text-[color:var(--color-accent)] font-mono tabular-nums">nr. {address.number}</span>
          <span className="text-xs opacity-70">· Sector {address.sector}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-10"
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[color:var(--color-muted)] font-medium">
            <AlertCircle size={14} className="text-amber-600" />
            Nu avem încă program pentru adresa ta
          </div>
          <h1 className="mt-3 text-[clamp(2rem,5.5vw,3rem)] font-semibold leading-[1.05] tracking-tight">
            Verifică direct la sursă
          </h1>
          <p className="mt-4 text-base text-[color:var(--color-muted)] leading-relaxed max-w-lg">
            Adresa <strong className="text-[color:var(--color-fg)]">{address.street} nr. {address.number}</strong> nu apare în datele publicate oficial pentru acest sector
            {sourceLabel ? <> de <strong className="text-[color:var(--color-fg)]">{sourceLabel}</strong></> : null}.
            Nu inventăm date — îți oferim linkul spre sursă să verifici tu direct.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="cta-primary"
              >
                <ExternalLink size={14} />
                vezi la {sourceLabel ?? 'sursa oficială'}
              </a>
            )}
            <button
              onClick={onSwitchAddress}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 backdrop-blur-xl px-4 py-2 text-sm text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)] transition"
            >
              <RefreshCw size={14} />
              alege altă adresă
            </button>
          </div>

        </motion.div>
      </div>

      <CoverageNote sector={address.sector} />
    </section>
  );
}
