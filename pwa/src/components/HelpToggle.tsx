import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Keyboard, Info } from 'lucide-react';

export function HelpToggle({ onReplayTour }: { onReplayTour: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.4 }}
        onClick={() => setOpen(true)}
        aria-label="Ajutor"
        className="fixed bottom-5 right-5 z-40 inline-flex items-center justify-center size-11 rounded-full bg-[color:var(--color-surface)]/90 backdrop-blur-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] shadow-[0_8px_28px_-12px_oklch(20%_0.04_160/0.35)] hover:text-[color:var(--color-fg)] hover:scale-105 transition"
      >
        <HelpCircle size={18} />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-[oklch(10%_0.015_162/0.6)] p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-6 shadow-[0_20px_48px_-12px_oklch(10%_0.05_160/0.5)]"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Info size={18} className="text-[color:var(--color-accent)]" />
                Cum se folosește
              </h2>

              <ul className="mt-5 space-y-3 text-[15px] leading-relaxed text-[color:var(--color-fg)]">
                <li className="flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)] text-xs font-semibold inline-flex items-center justify-center">1</span>
                  <span>
                    Apasă pe <strong>adresa ta</strong> (sus) ca să o schimbi oricând.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)] text-xs font-semibold inline-flex items-center justify-center">2</span>
                  <span>
                    <strong>Sub-hero-ul colorat</strong> se încălzește pe măsură ce se apropie ziua colectării.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)] text-xs font-semibold inline-flex items-center justify-center">3</span>
                  <span>
                    <strong>Bulina colorată</strong> (🟢🟡🟠🔴) arată cât de precisă e sursa. Apasă pe ea ca să mergi la site-ul oficial.
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="shrink-0 size-6 rounded-full bg-[color:var(--color-avatar-bg)] text-[color:var(--color-avatar-fg)] text-xs font-semibold inline-flex items-center justify-center">4</span>
                  <span>
                    <strong>Timeline-ul orizontal</strong> arată 14 zile înainte — trage cu degetul sau rotița mouse-ului.
                  </span>
                </li>
              </ul>

              <div className="mt-5 rounded-2xl bg-[color:var(--color-surface-tinted)] border border-[color:var(--color-border)] p-4">
                <h3 className="flex items-center gap-2 text-sm uppercase tracking-wider text-[color:var(--color-muted)] font-semibold">
                  <Keyboard size={14} /> scurtături
                </h3>
                <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm">
                  <dt><kbd className="font-mono px-1.5 py-0.5 rounded bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">?</kbd></dt>
                  <dd className="text-[color:var(--color-muted)]">deschide acest ghid</dd>
                  <dt><kbd className="font-mono px-1.5 py-0.5 rounded bg-[color:var(--color-surface)] border border-[color:var(--color-border)]">Esc</kbd></dt>
                  <dd className="text-[color:var(--color-muted)]">închide</dd>
                </dl>
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setOpen(false);
                    onReplayTour();
                  }}
                  className="flex-1 rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-2.5 text-sm font-medium hover:bg-[color:var(--color-fg)]/5 transition"
                >
                  Rulează turul din nou
                </button>
                <button onClick={() => setOpen(false)} className="cta-primary flex-1 justify-center">
                  Am înțeles
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Register `?` key globally to open help */
export function useHelpHotkey(onOpen: () => void) {
  if (typeof window === 'undefined') return;
  window.addEventListener('keydown', (e) => {
    if (
      e.key === '?' &&
      !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
    ) {
      e.preventDefault();
      onOpen();
    }
  });
}
