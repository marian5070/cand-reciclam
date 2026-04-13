import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Loader2, Check } from 'lucide-react';
import { shareCard } from '../lib/shareCard.js';
import type { Address, Pickup } from '../lib/types.js';
import { Tooltip } from './Tooltip.js';

type Status = 'idle' | 'working' | 'shared' | 'downloaded' | 'error';

export function ShareButton({
  address,
  pickups,
}: {
  address: Address;
  pickups: Pickup[];
}) {
  const [status, setStatus] = useState<Status>('idle');
  const canNativeShare =
    typeof navigator !== 'undefined' &&
    'canShare' in navigator &&
    typeof (navigator as Navigator & { canShare?: (d: ShareData) => boolean }).canShare === 'function';

  async function handle() {
    setStatus('working');
    try {
      const r = await shareCard(address, pickups);
      setStatus(r);
      setTimeout(() => setStatus('idle'), 2200);
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        setStatus('idle');
        return;
      }
      console.error(e);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2200);
    }
  }

  const label = canNativeShare ? 'Împărtășește' : 'Descarcă imagine';
  const Icon = canNativeShare ? Share2 : Download;

  return (
    <Tooltip
      content={canNativeShare ? 'Generează o imagine cu programul tău și o trimiți unde vrei' : 'Descarcă o imagine frumoasă cu programul tău'}
      side="top"
    >
      <button
        onClick={handle}
        disabled={status === 'working'}
        aria-label={label}
        className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)]/60 backdrop-blur-xl px-4 py-2 text-sm text-[color:var(--color-muted)] transition hover:text-[color:var(--color-fg)] hover:border-[color:var(--color-accent)] disabled:opacity-60"
      >
        <AnimatePresence mode="wait">
          {status === 'working' ? (
            <motion.span key="w" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> generez...
            </motion.span>
          ) : status === 'shared' || status === 'downloaded' ? (
            <motion.span key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2 text-[color:var(--color-accent)]">
              <Check size={14} />
              {status === 'shared' ? 'trimisă' : 'salvată'}
            </motion.span>
          ) : status === 'error' ? (
            <motion.span key="e" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-rose-500">
              încearcă din nou
            </motion.span>
          ) : (
            <motion.span key="i" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="inline-flex items-center gap-2">
              <Icon size={14} />
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}
