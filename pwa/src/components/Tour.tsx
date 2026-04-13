import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

export type TourStep = {
  /** CSS selector of the element to spotlight */
  target: string;
  title: string;
  body: string;
  /** Preferred side for the callout relative to target */
  side?: 'top' | 'bottom';
};

const STORAGE_KEY = 'cr:tour-seen';

export function Tour({
  steps,
  forceOpen = false,
  onClose,
}: {
  steps: TourStep[];
  forceOpen?: boolean;
  onClose?: () => void;
}) {
  const [open, setOpen] = useState(() => {
    if (forceOpen) return true;
    try {
      return localStorage.getItem(STORAGE_KEY) !== '1';
    } catch {
      return true;
    }
  });
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  useEffect(() => {
    if (!open) return;
    const step = steps[idx];
    if (!step) return;
    const updateRect = () => {
      const el = document.querySelector(step.target);
      if (!el) {
        setRect(null);
        return;
      }
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTimeout(() => setRect(el.getBoundingClientRect()), 400);
    };
    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [open, idx, steps]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function next() {
    if (idx < steps.length - 1) setIdx(idx + 1);
    else finish();
  }

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {}
    setOpen(false);
    setIdx(0);
    onClose?.();
  }

  if (!open || steps.length === 0) return null;
  const step = steps[idx];
  if (!step) return null;

  const hasRect = rect !== null;
  const padding = 12;
  const holeStyle = hasRect
    ? {
        top: Math.max(0, rect.top - padding),
        left: Math.max(0, rect.left - padding),
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
      }
    : null;

  const side = step.side ?? (hasRect && rect.top > window.innerHeight / 2 ? 'top' : 'bottom');
  const calloutStyle = hasRect
    ? side === 'bottom'
      ? { top: rect.bottom + 16, left: Math.min(Math.max(16, rect.left), window.innerWidth - 360) }
      : { top: rect.top - 16, left: Math.min(Math.max(16, rect.left), window.innerWidth - 360), transform: 'translateY(-100%)' }
    : { top: window.innerHeight / 2 - 80, left: window.innerWidth / 2 - 170 };

  return (
    <AnimatePresence>
      <motion.div
        key="tour-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] pointer-events-auto"
        onClick={next}
      >
        {/* Backdrop with spotlight hole using box-shadow */}
        {holeStyle && (
          <motion.div
            key="hole"
            layout
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="absolute rounded-3xl"
            style={{
              ...holeStyle,
              boxShadow: '0 0 0 9999px oklch(10% 0.015 162 / 0.68)',
              border: '1px solid oklch(78% 0.06 145 / 0.6)',
              pointerEvents: 'none',
            }}
          />
        )}
        {!holeStyle && (
          <div className="absolute inset-0 bg-[oklch(10%_0.015_162/0.7)]" />
        )}

        {/* Callout */}
        <motion.div
          key={`step-${idx}`}
          initial={{ opacity: 0, y: side === 'bottom' ? -6 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={calloutStyle}
          className="absolute w-[min(340px,calc(100vw-32px))] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-4 shadow-[0_20px_48px_-12px_oklch(10%_0.05_160/0.5)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <div className="mb-1 flex items-center gap-2">
                <span className="inline-flex items-center justify-center size-5 rounded-full bg-[color:var(--color-sage-500)] text-white text-[10px] font-semibold tabular-nums">
                  {idx + 1}
                </span>
                <span className="text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
                  pas {idx + 1} din {steps.length}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-tight">{step.title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[color:var(--color-muted)]">{step.body}</p>
            </div>
            <button
              onClick={finish}
              aria-label="Închide ghidul"
              className="shrink-0 rounded-lg p-1 text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-fg)]/5 transition"
            >
              <X size={14} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={finish}
              className="text-xs text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition"
            >
              sari peste
            </button>
            <button onClick={next} className="cta-primary text-xs px-3 py-1.5">
              {idx === steps.length - 1 ? 'Gata' : 'Următorul'}
              <ArrowRight size={12} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
