import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle } from 'lucide-react';

/**
 * Small (?) button that toggles a popover with an explanation.
 * Click/tap to toggle, Esc to close, click outside to close.
 * Uses native Popover API patterns via aria-expanded + anchor layout.
 */
export function InfoHint({
  children,
  label = 'Mai multe informații',
  size = 14,
  side = 'bottom',
}: {
  children: ReactNode;
  label?: string;
  size?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pos = {
    top: 'bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    bottom: 'top-[calc(100%+8px)] left-1/2 -translate-x-1/2',
    left: 'right-[calc(100%+8px)] top-1/2 -translate-y-1/2',
    right: 'left-[calc(100%+8px)] top-1/2 -translate-y-1/2',
  }[side];

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center rounded-full text-[color:var(--color-muted)] hover:text-[color:var(--color-fg)] transition-colors"
        style={{ width: size + 6, height: size + 6 }}
      >
        <HelpCircle size={size} strokeWidth={2} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            initial={{ opacity: 0, scale: 0.92, y: side === 'top' ? 4 : -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute z-40 ${pos} w-max max-w-[320px] rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] backdrop-blur-xl px-4 py-3 text-sm leading-relaxed text-[color:var(--color-fg)] shadow-[0_16px_40px_-12px_oklch(20%_0.04_160/0.5)]`}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
