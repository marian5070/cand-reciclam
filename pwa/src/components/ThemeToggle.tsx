import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Tooltip } from './Tooltip.js';

type Mode = 'light' | 'dark' | 'auto';
const KEY = 'cr:theme';

function resolveTheme(): Mode {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'light' || v === 'dark' || v === 'auto') return v;
  } catch {}
  return 'auto';
}

function applyTheme(mode: Mode) {
  const isDark =
    mode === 'dark' ||
    (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

export function ThemeToggle() {
  const [mode, setMode] = useState<Mode>(() => resolveTheme());

  useEffect(() => {
    applyTheme(mode);
    try {
      localStorage.setItem(KEY, mode);
    } catch {}
  }, [mode]);

  useEffect(() => {
    if (mode !== 'auto') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('auto');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [mode]);

  const next: Record<Mode, Mode> = { auto: 'light', light: 'dark', dark: 'auto' };
  const label: Record<Mode, string> = {
    auto: 'Temă: automată (urmează sistemul)',
    light: 'Temă: luminoasă',
    dark: 'Temă: întunecată',
  };
  const Icon = { auto: Monitor, light: Sun, dark: Moon }[mode];

  return (
    <Tooltip content={`${label[mode]} · apasă să schimbi`} side="left">
      <button
        onClick={() => setMode(next[mode])}
        aria-label={label[mode]}
        className="fixed bottom-5 right-[72px] z-40 inline-flex items-center justify-center size-11 rounded-full bg-[color:var(--color-surface)]/90 backdrop-blur-xl border border-[color:var(--color-border)] text-[color:var(--color-muted)] shadow-[0_8px_28px_-12px_oklch(20%_0.04_160/0.35)] hover:text-[color:var(--color-fg)] hover:scale-105 transition"
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={mode}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Icon size={18} />
          </motion.span>
        </AnimatePresence>
      </button>
    </Tooltip>
  );
}
